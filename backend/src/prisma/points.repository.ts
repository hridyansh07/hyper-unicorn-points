import { Inject, Injectable } from '@nestjs/common';
import { EntryPoint, Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

@Injectable()
export class PointsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  transaction<T>(handler: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(handler);
  }

  async findProtocolConfig(tx?: Prisma.TransactionClient) {
    return (tx ?? this.prisma).protocolConfig.findUniqueOrThrow({
      where: { id: 1 },
    });
  }

  async updateProtocolVaultMultiplier(
    vaultMultRaw: string,
    tx?: Prisma.TransactionClient,
  ) {
    return (tx ?? this.prisma).protocolConfig.update({
      where: { id: 1 },
      data: { vaultMultRaw },
    });
  }

  async upsertUser(tx: Prisma.TransactionClient, address: string) {
    return tx.user.upsert({
      where: { address },
      update: {},
      create: { address },
    });
  }

  async createShard(
    tx: Prisma.TransactionClient,
    data: Prisma.ShardUncheckedCreateInput,
  ) {
    return tx.shard.create({ data });
  }

  async listActiveShardsForWithdraw(
    tx: Prisma.TransactionClient,
    userAddress: string,
    entrypoint: EntryPoint,
    sourceAsset: string,
    sourceDecimals: number,
  ) {
    return tx.shard.findMany({
      where: {
        userAddress,
        entrypoint,
        sourceAsset,
        sourceDecimals,
        active: true,
      },
      orderBy: [{ startTime: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async listActiveShardsForAccrual(tx: Prisma.TransactionClient) {
    return tx.shard.findMany({
      where: { active: true },
      orderBy: [{ userAddress: 'asc' }, { startTime: 'asc' }],
    });
  }

  async consumeShard(tx: Prisma.TransactionClient, shardId: string) {
    return tx.shard.update({
      where: { id: shardId },
      data: { active: false },
    });
  }

  async reduceShard(
    tx: Prisma.TransactionClient,
    shardId: string,
    sourceQuantityRaw: string,
    principalUsdRaw: string,
  ) {
    return tx.shard.update({
      where: { id: shardId },
      data: { sourceQuantityRaw, principalUsdRaw },
    });
  }

  async applyShardAccrual(
    tx: Prisma.TransactionClient,
    shardId: string,
    userAddress: string,
    deltaRaw: bigint,
    lastAccrualTime: Date,
  ) {
    if (deltaRaw === 0n) {
      return tx.shard.update({
        where: { id: shardId },
        data: { lastAccrualTime },
      });
    }

    const deltaString = deltaRaw.toString();

    await tx.$executeRaw`
      UPDATE "User"
      SET "totalPointsRaw" = ("totalPointsRaw"::numeric + ${deltaString}::numeric)::text
      WHERE "address" = ${userAddress}
    `;

    await tx.$executeRaw`
      UPDATE "Shard"
      SET "accruedPointsRaw" = ("accruedPointsRaw"::numeric + ${deltaString}::numeric)::text,
          "lastAccrualTime" = ${lastAccrualTime}
      WHERE "id" = ${shardId}
    `;

    return tx.shard.findUniqueOrThrow({ where: { id: shardId } });
  }

  async findUserWithActiveShards(address: string) {
    return this.prisma.user.findUnique({
      where: { address },
      include: { shards: { where: { active: true } } },
    });
  }

  async findUserShards(address: string) {
    return this.prisma.shard.findMany({
      where: { userAddress: address },
      orderBy: [{ active: 'desc' }, { startTime: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async listUsersWithActiveShards() {
    return this.prisma.user.findMany({
      include: { shards: { where: { active: true } } },
    });
  }

  async listUsersForLeaderboard() {
    return this.prisma.user.findMany();
  }
}
