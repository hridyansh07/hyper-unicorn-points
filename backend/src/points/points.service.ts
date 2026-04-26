import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { EntryPoint, Prisma, ProtocolConfig, Shard } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { formatUnits } from 'viem';
import { normalizeAddress } from '../common/utils/address.util';
import { PointsRepository } from '../prisma/points.repository';
import { DepositEventDto } from './dto/deposit-event.dto';
import { VaultMultChangedEventDto } from './dto/vault-mult-changed-event.dto';
import { WithdrawEventDto } from './dto/withdraw-event.dto';
import { accruedPointsRaw } from './math/accrual';
import { ONE } from './math/fixed-point';

const VIRTUAL_POINTS_BUCKET_MS = 60 * 1000;

@Injectable()
export class PointsService implements OnModuleInit {
  private readonly logger = new Logger(PointsService.name);
  private protocolConfig!: ProtocolConfig;

  constructor(
    @Inject(PointsRepository)
    private readonly pointsRepository: PointsRepository,
  ) {}

  async onModuleInit() {
    this.protocolConfig = await this.pointsRepository.findProtocolConfig();
  }

  async processDeposit(dto: DepositEventDto) {
    const userAddress = normalizeAddress(dto.userAddress);
    const occurredAt = this.parseDate(dto.occurredAt);

    return this.pointsRepository.transaction(async (tx) => {
      await this.pointsRepository.upsertUser(tx, userAddress);

      const lockedRateRaw =
        dto.entrypoint === EntryPoint.DIRECT
          ? ONE.toString()
          : (await this.pointsRepository.findProtocolConfig(tx)).vaultMultRaw;

      const shard = await this.pointsRepository.createShard(tx, {
        userAddress,
        entrypoint: dto.entrypoint,
        sourceId: dto.sourceId,
        sourceAsset: dto.sourceAsset,
        sourceQuantityRaw: BigInt(dto.sourceQuantityRaw).toString(),
        sourceDecimals: dto.sourceDecimals,
        principalUsdRaw: BigInt(dto.principalUsdRaw).toString(),
        lockedRateRaw,
        startTime: occurredAt,
        lastAccrualTime: occurredAt,
      });

      return { shard };
    });
  }

  async processWithdraw(dto: WithdrawEventDto) {
    const userAddress = normalizeAddress(dto.userAddress);
    const requestedQuantity = BigInt(dto.sourceQuantityRaw);
    const occurredAt = this.parseDate(dto.occurredAt);

    return this.pointsRepository.transaction(async (tx) => {
      const shards = await this.pointsRepository.listActiveShardsForWithdraw(
        tx,
        userAddress,
        dto.entrypoint,
        dto.sourceAsset,
        dto.sourceDecimals,
      );

      const totalAvailable = shards.reduce(
        (sum, shard) => sum + BigInt(shard.sourceQuantityRaw),
        0n,
      );

      if (totalAvailable < requestedQuantity) {
        throw new BadRequestException('Insufficient source quantity');
      }

      let remaining = requestedQuantity;
      const touchedShardIds: string[] = [];

      for (const shard of shards) {
        if (remaining === 0n) {
          break;
        }

        await this.crystallizeShard(tx, shard, occurredAt);

        const shardQuantity = BigInt(shard.sourceQuantityRaw);
        const shardPrincipal = BigInt(shard.principalUsdRaw);
        touchedShardIds.push(shard.id);

        if (remaining >= shardQuantity) {
          remaining -= shardQuantity;
          await this.pointsRepository.consumeShard(tx, shard.id);
          continue;
        }

        const principalToRemove = (shardPrincipal * remaining) / shardQuantity;
        await this.pointsRepository.reduceShard(
          tx,
          shard.id,
          (shardQuantity - remaining).toString(),
          (shardPrincipal - principalToRemove).toString(),
        );
        remaining = 0n;
      }

      return { touchedShardIds };
    });
  }

  async processVaultMultChanged(dto: VaultMultChangedEventDto) {
    const config = await this.pointsRepository.transaction((tx) =>
      this.pointsRepository.updateProtocolVaultMultiplier(dto.vaultMultRaw, tx),
    );

    this.protocolConfig = config;

    return { config };
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async crystallizeActiveShardsCron() {
    const result = await this.crystallizeAllActiveShards(new Date());

    this.logger.log(
      `Crystallized ${result.crystallizedShardCount} active shards for ${result.totalDeltaRaw} raw points`,
    );
  }

  async getUserPoints(address: string) {
    const userAddress = normalizeAddress(address);
    const asOf = this.bucketedNow();
    const user =
      await this.pointsRepository.findUserWithActiveShards(userAddress);

    if (!user) {
      return {
        address: userAddress,
        totalPointsRaw: '0',
        totalPoints: '0',
        virtualTotalPointsRaw: '0',
        virtualTotalPoints: '0',
        asOf: asOf.toISOString(),
      };
    }

    const storedTotal = BigInt(user.totalPointsRaw);
    const virtualTotal =
      storedTotal +
      user.shards.reduce(
        (sum, shard) => sum + this.virtualShardDelta(shard, asOf),
        0n,
      );
    return {
      address: userAddress,
      totalPointsRaw: storedTotal.toString(),
      totalPoints: formatUnits(storedTotal, 18),
      virtualTotalPointsRaw: virtualTotal.toString(),
      virtualTotalPoints: formatUnits(virtualTotal, 18),
      asOf: asOf.toISOString(),
    };
  }

  async getUserShards(address: string) {
    const userAddress = normalizeAddress(address);
    const shards = await this.pointsRepository.findUserShards(userAddress);
    const asOf = this.bucketedNow();

    return shards.map((shard) => {
      const virtualDelta = shard.active
        ? this.virtualShardDelta(shard, asOf)
        : 0n;
      const accruedPoints = BigInt(shard.accruedPointsRaw);
      const virtualAccruedPoints = accruedPoints + virtualDelta;

      return {
        ...shard,
        accruedPoints: formatUnits(accruedPoints, 18),
        virtualDeltaRaw: virtualDelta.toString(),
        virtualAccruedPointsRaw: virtualAccruedPoints.toString(),
        virtualAccruedPoints: formatUnits(virtualAccruedPoints, 18),
        asOf: asOf.toISOString(),
      };
    });
  }

  // Simplifying leaderboards to work using simple calculations assuming very small number of users
  // Ideally this is done using a database which caches users and points you need not update every minute
  async getLeaderboard() {
    const users = await this.pointsRepository.listUsersForLeaderboard();

    return users
      .map((user) => {
        const storedTotal = BigInt(user.totalPointsRaw);

        return {
          address: user.address,
          totalPointsRaw: storedTotal.toString(),
          totalPoints: formatUnits(storedTotal, 18),
        };
      })
      .sort((a, b) => {
        const aTotal = BigInt(a.totalPointsRaw);
        const bTotal = BigInt(b.totalPointsRaw);

        if (aTotal === bTotal) {
          return a.address.localeCompare(b.address);
        }

        return aTotal > bTotal ? -1 : 1;
      })
      .map((row, index) => ({ rank: index + 1, ...row }));
  }

  async crystallizeAllActiveShards(timestamp: Date) {
    return this.pointsRepository.transaction(async (tx) => {
      const shards = await this.pointsRepository.listActiveShardsForAccrual(tx);
      let crystallizedShardCount = 0;
      let totalDeltaRaw = 0n;

      for (const shard of shards) {
        if (timestamp < shard.lastAccrualTime) {
          continue;
        }

        const deltaRaw = this.computeShardDelta(shard, timestamp);
        totalDeltaRaw += deltaRaw;

        await this.pointsRepository.applyShardAccrual(
          tx,
          shard.id,
          shard.userAddress,
          deltaRaw,
          timestamp,
        );
        crystallizedShardCount += 1;
      }

      return {
        crystallizedShardCount,
        totalDeltaRaw: totalDeltaRaw.toString(),
      };
    });
  }

  // Ideally timestamps are not requested but triggered through on-chain events mocking this here
  private async crystallizeShard(
    tx: Prisma.TransactionClient,
    shard: Shard,
    timestamp: Date,
  ) {
    if (timestamp < shard.lastAccrualTime) {
      throw new BadRequestException(
        'Timestamp cannot be before shard lastAccrualTime',
      );
    }

    await this.pointsRepository.applyShardAccrual(
      tx,
      shard.id,
      shard.userAddress,
      this.computeShardDelta(shard, timestamp),
      timestamp,
    );
  }

  private computeShardDelta(
    shard: Pick<
      Shard,
      'principalUsdRaw' | 'lockedRateRaw' | 'startTime' | 'lastAccrualTime'
    >,
    timestamp: Date,
  ): bigint {
    return accruedPointsRaw(
      BigInt(shard.principalUsdRaw),
      BigInt(shard.lockedRateRaw),
      this.secondsBetween(shard.startTime, shard.lastAccrualTime),
      this.secondsBetween(shard.startTime, timestamp),
      BigInt(this.protocolConfig.mMaxRaw),
      BigInt(this.protocolConfig.tCapSeconds),
    );
  }

  private virtualShardDelta(
    shard: Pick<
      Shard,
      'principalUsdRaw' | 'lockedRateRaw' | 'startTime' | 'lastAccrualTime'
    >,
    asOf: Date,
  ): bigint {
    if (asOf <= shard.lastAccrualTime) {
      return 0n;
    }

    return this.computeShardDelta(shard, asOf);
  }

  /// Since the points are ever changing every API call will give back new points with a new Multiplier
  /// Hence we bucket the points to the previous minute ensuring that for a minute every API call gives back the same value 
  /// Can be modified to make the bucket larger or smaller depending on what cache we would want on the frontend
  private bucketedNow(): Date {
    return new Date(
      Math.floor(Date.now() / VIRTUAL_POINTS_BUCKET_MS) *
        VIRTUAL_POINTS_BUCKET_MS,
    );
  }

  private parseDate(value: string): Date {
    return new Date(value);
  }

  private secondsBetween(start: Date, end: Date): bigint {
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) {
      throw new BadRequestException(
        'Timestamp cannot be before shard startTime',
      );
    }

    return BigInt(Math.floor(diffMs / 1000));
  }
}
