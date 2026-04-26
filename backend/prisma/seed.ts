import { EntryPoint, PrismaClient } from '@prisma/client';
import { getAddress, parseUnits } from 'viem';

const prisma = new PrismaClient();
const one = 10n ** 18n;
/// Maximum Time Age Multiplier Currently set to 2.5X
const mMaxRaw = parseUnits('2.5', 18).toString(); 
/// Vault Points Multiplier used for incentivizing different streams if Vaults are preferred over direct deposits 
/// Set to 1 to remove any difference between Vault and Direct Deposits 
const vaultMultRaw = parseUnits('1.35', 18).toString();
/// Time taken for time multiplier to reach the maximum multipler it scales for 1 -> 2.5
/// To calculate points in between we use an integral to calcualte the points between 2 arbitary points on the curve where the multiple is ramping up
/// Alternatively just calculate the points from start every time and you end up on the same amount (Much Simpler Approach but makes applying partial withdraws difficult) 
const tCapSeconds = 180 * 24 * 60 * 60;

// Day 0 for the seeded world. All deposit timestamps are expressed as offsets
// from this date. Points are not precomputed — shards are seeded with the
// default `accruedPointsRaw = 0` and `lastAccrualTime = startTime`, so the
// virtual accrual path (and the hourly crystallize cron) derive points from
// the shard's age.
const DAY_0 = new Date('2026-03-01T00:00:00.000Z');

function dayOffset(days: number): Date {
  return new Date(DAY_0.getTime() + days * 24 * 60 * 60 * 1000);
}

function usd(value: string): string {
  return parseUnits(value, 18).toString();
}

type SeedDeposit = {
  entrypoint: EntryPoint;
  sourceId: string;
  sourceAsset: string;
  sourceQuantityRaw: string;
  sourceDecimals: number;
  principalUsdRaw: string;
  startTime: Date;
};

type SeedUser = {
  label: string;
  address: `0x${string}`;
  deposits: SeedDeposit[];
};

// Leaderboard-only users. They have no shards, just a pre-populated
// `totalPointsRaw`, so the leaderboard renders a populated list out of the
// box without waiting for the active users to crystallize. The #1 spot is
// pinned at 10M points; the rest are sprinkled to interleave with the four
// shard-driven users above as their points accrue.
type LeaderboardOnlyUser = {
  label: string;
  address: `0x${string}`;
  totalPoints: string;
};


/// Because of the way the Points system is setup there is no events key right now which might be used to replay events 
/// Hence withdraws cannot be seeded into the system rather you can issue arbitary withdraws from the frontend 
/// The only condition being the withdraw cannot be done before the points are issued to your shard. 
/// This is the reason why points are not automatically issued into the system and run on multiple hour CRON jobs to allow for withdrawal testing
const demoUsers: SeedUser[] = [
  // User 1 — Whale Vault depositor.
  // Single large VAULT deposit on Day 0. Demonstrates a long, undisturbed
  // vault position accruing at the locked vault_mult with no further activity.
  {
    label: 'Whale Vault depositor',
    address: getAddress('0x1111111111111111111111111111111111111111'),
    deposits: [
      {
        entrypoint: EntryPoint.VAULT,
        sourceId: 'vault-eth-usdc',
        sourceAsset: 'ETH-USDC Vault',
        sourceQuantityRaw: parseUnits('30', 18).toString(),
        sourceDecimals: 18,
        principalUsdRaw: usd('13500'),
        startTime: dayOffset(0),
      },
    ],
  },

  // User 2 — Vault DCA depositor.
  // Recurring VAULT deposits every 7 days into the same stable vault. Each
  // deposit creates a new shard with its own age, so older shards earn at a
  // higher time_mult than newer ones — useful for showing per-shard divergence.
  {
    label: 'Vault DCA depositor (bi-weekly cadence)',
    address: getAddress('0x2222222222222222222222222222222222222222'),
    deposits: [
      {
        entrypoint: EntryPoint.VAULT,
        sourceId: 'vault-stable',
        sourceAsset: 'Stable Vault',
        sourceQuantityRaw: parseUnits('5000', 6).toString(),
        sourceDecimals: 6,
        principalUsdRaw: usd('5000'),
        startTime: dayOffset(0),
      },
      {
        entrypoint: EntryPoint.VAULT,
        sourceId: 'vault-stable',
        sourceAsset: 'Stable Vault',
        sourceQuantityRaw: parseUnits('5000', 6).toString(),
        sourceDecimals: 6,
        principalUsdRaw: usd('5000'),
        startTime: dayOffset(14),
      },
      {
        entrypoint: EntryPoint.VAULT,
        sourceId: 'vault-stable',
        sourceAsset: 'Stable Vault',
        sourceQuantityRaw: parseUnits('5000', 6).toString(),
        sourceDecimals: 6,
        principalUsdRaw: usd('5000'),
        startTime: dayOffset(28),
      },
      {
        entrypoint: EntryPoint.VAULT,
        sourceId: 'vault-stable',
        sourceAsset: 'Stable Vault',
        sourceQuantityRaw: parseUnits('5000', 6).toString(),
        sourceDecimals: 6,
        principalUsdRaw: usd('5000'),
        startTime: dayOffset(42),
      },
    ],
  },

  // User 3 — Mixed direct + vault depositor.
  // Heavy on DIRECT positions with a small VAULT slice. Demonstrates that
  // mixed users can land in the same point band as a long-term vault user,
  // but only by putting up materially more capital — the lower locked_rate
  // on DIRECT shards taxes per-dollar efficiency, which is by design.
  {
    label: 'Mixed direct + vault depositor',
    address: getAddress('0x3333333333333333333333333333333333333333'),
    deposits: [
      {
        entrypoint: EntryPoint.DIRECT,
        sourceId: 'pool-wbtc-usdc',
        sourceAsset: 'WBTC-USDC LP',
        sourceQuantityRaw: parseUnits('0.15', 8).toString(),
        sourceDecimals: 8,
        principalUsdRaw: usd('10000'),
        startTime: dayOffset(8),
      },
      {
        entrypoint: EntryPoint.VAULT,
        sourceId: 'vault-stable',
        sourceAsset: 'Stable Vault',
        sourceQuantityRaw: parseUnits('3000', 6).toString(),
        sourceDecimals: 6,
        principalUsdRaw: usd('3000'),
        startTime: dayOffset(20),
      },
      {
        entrypoint: EntryPoint.DIRECT,
        sourceId: 'pool-eth-usdc',
        sourceAsset: 'ETH-USDC LP',
        sourceQuantityRaw: parseUnits('3.5', 18).toString(),
        sourceDecimals: 18,
        principalUsdRaw: usd('12000'),
        startTime: dayOffset(30),
      },
    ],
  },

  // User 4 — High-frequency direct LP.
  // Seven DIRECT positions across multiple pools, opened on a roughly
  // every-3-days cadence. Stress-tests LIFO withdraw across many shards of
  // the same entrypoint and per-shard time_mult divergence.
  {
    label: 'High-frequency direct LP',
    address: getAddress('0x4444444444444444444444444444444444444444'),
    deposits: [
      {
        entrypoint: EntryPoint.DIRECT,
        sourceId: 'pool-eth-usdc',
        sourceAsset: 'ETH-USDC LP',
        sourceQuantityRaw: parseUnits('1.2', 18).toString(),
        sourceDecimals: 18,
        principalUsdRaw: usd('3900'),
        startTime: dayOffset(0),
      },
      {
        entrypoint: EntryPoint.DIRECT,
        sourceId: 'pool-wbtc-usdc',
        sourceAsset: 'WBTC-USDC LP',
        sourceQuantityRaw: parseUnits('0.05', 8).toString(),
        sourceDecimals: 8,
        principalUsdRaw: usd('3300'),
        startTime: dayOffset(3),
      },
      {
        entrypoint: EntryPoint.DIRECT,
        sourceId: 'pool-eth-usdc',
        sourceAsset: 'ETH-USDC LP',
        sourceQuantityRaw: parseUnits('0.8', 18).toString(),
        sourceDecimals: 18,
        principalUsdRaw: usd('2600'),
        startTime: dayOffset(6),
      },
      {
        entrypoint: EntryPoint.DIRECT,
        sourceId: 'pool-arb-usdc',
        sourceAsset: 'ARB-USDC LP',
        sourceQuantityRaw: parseUnits('5000', 18).toString(),
        sourceDecimals: 18,
        principalUsdRaw: usd('4500'),
        startTime: dayOffset(9),
      },
      {
        entrypoint: EntryPoint.DIRECT,
        sourceId: 'pool-eth-usdc',
        sourceAsset: 'ETH-USDC LP',
        sourceQuantityRaw: parseUnits('0.5', 18).toString(),
        sourceDecimals: 18,
        principalUsdRaw: usd('1650'),
        startTime: dayOffset(12),
      },
      {
        entrypoint: EntryPoint.DIRECT,
        sourceId: 'pool-wbtc-usdc',
        sourceAsset: 'WBTC-USDC LP',
        sourceQuantityRaw: parseUnits('0.03', 8).toString(),
        sourceDecimals: 8,
        principalUsdRaw: usd('1980'),
        startTime: dayOffset(15),
      },
      {
        entrypoint: EntryPoint.DIRECT,
        sourceId: 'pool-arb-usdc',
        sourceAsset: 'ARB-USDC LP',
        sourceQuantityRaw: parseUnits('2200', 18).toString(),
        sourceDecimals: 18,
        principalUsdRaw: usd('1980'),
        startTime: dayOffset(18),
      },
    ],
  },
];

/// Named leaderboard-only users. Combined with the procedural fillers below,
/// these dilute the leaderboard so the APEX tier (top 10) is selective: User 1
/// (the loyalty whale) lands at rank ~10 and the other shard-driven users sit
/// in TOP 100. Tuned against current accrual estimates:
///   User 1 ≈ 1.37M, User 4 ≈ 1.27M, User 2 ≈ 1.20M, User 3 ≈ 1.18M
const leaderboardOnlyUsers: LeaderboardOnlyUser[] = [
  {
    label: 'Leaderboard #1 — pinned whale',
    address: getAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    totalPoints: '10000000',
  },
  {
    label: 'Top contender',
    address: getAddress('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
    totalPoints: '5000000',
  },
  {
    label: 'High-tier farmer',
    address: getAddress('0xcccccccccccccccccccccccccccccccccccccccc'),
    totalPoints: '3500000',
  },
  {
    label: 'Mid-high-tier farmer',
    address: getAddress('0xdddddddddddddddddddddddddddddddddddddddd'),
    totalPoints: '2500000',
  },
  {
    label: 'Mid-tier farmer',
    address: getAddress('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'),
    totalPoints: '2000000',
  },
  {
    label: 'APEX boundary',
    address: getAddress('0xffffffffffffffffffffffffffffffffffffffff'),
    totalPoints: '1700000',
  },
];

/// Procedural filler users. Three sit just above User 1 (1.37M) to push him to
/// rank ~10 (last APEX slot); the rest decay exponentially down the tail so
/// the leaderboard renders ~110 entries with a natural-looking distribution.
function fillerAddress(index: number): `0x${string}` {
  // Hex starts at 0x10000 to stay clear of the 0x1111…/0xaaaa… patterns above.
  const hex = (0x10000 + index).toString(16).padStart(40, '0');
  return getAddress(`0x${hex}`);
}

const ABOVE_USER_1_FILLERS = [1_600_000, 1_500_000, 1_450_000];
const TAIL_COUNT = 97;
const TAIL_START = 1_100_000;
const TAIL_END = 1_000;

function tailPoints(index: number): number {
  const ratio = Math.pow(TAIL_END / TAIL_START, index / (TAIL_COUNT - 1));
  return Math.floor(TAIL_START * ratio);
}

function buildProceduralFillers(): LeaderboardOnlyUser[] {
  const fillers: LeaderboardOnlyUser[] = [];
  let index = 0;

  for (const points of ABOVE_USER_1_FILLERS) {
    index += 1;
    fillers.push({
      label: `Filler #${index}`,
      address: fillerAddress(index),
      totalPoints: points.toString(),
    });
  }

  for (let i = 0; i < TAIL_COUNT; i++) {
    index += 1;
    fillers.push({
      label: `Filler #${index}`,
      address: fillerAddress(index),
      totalPoints: tailPoints(i).toString(),
    });
  }

  return fillers;
}

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.shard.deleteMany();
    await tx.user.deleteMany();
    await tx.protocolConfig.deleteMany();

    await tx.protocolConfig.create({
      data: {
        id: 1,
        vaultMultRaw,
        mMaxRaw,
        tCapSeconds,
      },
    });

    let shardCounter = 0;

    for (const user of demoUsers) {
      await tx.user.create({
        data: { address: user.address },
      });

      for (const deposit of user.deposits) {
        shardCounter += 1;
        await tx.shard.create({
          data: {
            id: `seed-shard-${shardCounter}`,
            userAddress: user.address,
            entrypoint: deposit.entrypoint,
            sourceId: deposit.sourceId,
            sourceAsset: deposit.sourceAsset,
            sourceQuantityRaw: deposit.sourceQuantityRaw,
            sourceDecimals: deposit.sourceDecimals,
            principalUsdRaw: deposit.principalUsdRaw,
            lockedRateRaw:
              deposit.entrypoint === EntryPoint.DIRECT
                ? one.toString()
                : vaultMultRaw,
            startTime: deposit.startTime,
            lastAccrualTime: deposit.startTime,
          },
        });
      }
    }

    const allLeaderboardOnly = [
      ...leaderboardOnlyUsers,
      ...buildProceduralFillers(),
    ];

    for (const user of allLeaderboardOnly) {
      await tx.user.create({
        data: {
          address: user.address,
          totalPointsRaw: parseUnits(user.totalPoints, 18).toString(),
        },
      });
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
