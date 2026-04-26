# HyperUnicorn Points Backend

Nest.js backend for a simple DEX LP points program.

This backend tracks user deposits as independent shards, accrues points over
time, supports partial withdrawals, and exposes a small API for a mock frontend.
It is intentionally event-driven and lightweight: no auth, no chain indexer, no
oracle integration, and no production campaign engine.

For the deeper architecture notes, see [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md).

---

## What We Built

### Implemented

- Nest.js API under `/v1`
- Postgres persistence through Prisma
- Prisma migrations and seed script
- EVM wallet addresses as user IDs
- Per-deposit shard accounting
- Direct LP and vault entrypoints
- Locked vault multiplier per vault deposit
- Fixed original USD principal per shard
- LIFO withdrawals by source bucket
- Proportional principal reduction on partial withdrawals
- Continuous points accrual using a closed-form integral
- Per-user stored point totals
- Per-shard stored earned points for UI display
- Minute-bucketed virtual point reads
- All-time leaderboard by stored points
- Hourly crystallization cron
- Manual admin crystallization endpoint
- Global Prisma exception filter
- Joi-based environment validation
- Mock seed data for frontend profiling

### Intentionally Not Built

- Real chain indexing
- Auth or admin permissions
- Oracle pricing
- TGE snapshot flow
- Weekly/monthly leaderboard windows
- Bonus point schedules
- Append-only event replay log
- Sybil controls

Those are good follow-up layers, but they were left out to keep the v1 mock
small and easy to reason about.

---

## Stack

- Nest.js
- Prisma
- Postgres
- Yarn
- `viem`
- Native `bigint`
- `@nestjs/config`
- `@nestjs/schedule`

---

## Setup

From the repo root, the easiest path is Docker Compose:

```bash
docker compose up
```

That starts Postgres, runs backend install/generate/migrations/seed, starts the
backend on `3001`, and starts the frontend.

For backend-only local development:

```bash
cd backend
cp .env.example .env
yarn install
yarn prisma:generate
yarn prisma:migrate
yarn prisma:seed
yarn start:dev
```

The backend listens on `PORT`, defaulting to `3001`.

After building, run compiled output with:

```bash
yarn build
yarn start:prod
```

---

## Environment

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/panoptic_points?schema=public"
PORT=3001
```

`DATABASE_URL` is required. `PORT` defaults to `3001`.

The app verifies that the seeded `ProtocolConfig` row exists on startup. If it
is missing, run:

```bash
yarn prisma:seed
```

---

## Scripts

```bash
yarn build              # compile Nest app
yarn start:dev          # run in watch mode
yarn start:prod         # run compiled dist/main.js
yarn test               # run Jest tests
yarn lint               # run ESLint with fixes
yarn prisma:generate    # generate Prisma client
yarn prisma:migrate     # create/apply dev migration
yarn prisma:deploy      # apply migrations in deploy mode
yarn prisma:seed        # reset and seed mock data
yarn prisma:studio      # open Prisma Studio
```

---

## API

All routes are currently controller-versioned under `/v1`.

### Events

```http
POST /v1/events/deposit
POST /v1/events/withdraw
POST /v1/events/vault-mult-changed
```

Deposit payload:

```json
{
  "userAddress": "0x1111111111111111111111111111111111111111",
  "entrypoint": "VAULT",
  "sourceId": "vault-stable",
  "sourceAsset": "Stable Vault",
  "sourceQuantityRaw": "1000000000",
  "sourceDecimals": 6,
  "principalUsdRaw": "1000000000000000000000",
  "occurredAt": "2026-04-27T00:00:00.000Z"
}
```

Withdraw payload:

```json
{
  "userAddress": "0x1111111111111111111111111111111111111111",
  "entrypoint": "VAULT",
  "sourceAsset": "Stable Vault",
  "sourceDecimals": 6,
  "sourceQuantityRaw": "500000000",
  "occurredAt": "2026-04-27T00:00:00.000Z"
}
```

Vault multiplier payload:

```json
{
  "vaultMultRaw": "1350000000000000000",
  "occurredAt": "2026-04-27T00:00:00.000Z"
}
```

### Users

```http
GET /v1/users/:address/points
GET /v1/users/:address/shards
```

### Leaderboard

```http
GET /v1/leaderboard
```

### Admin

```http
POST /v1/admin/crystallize
```

This manually crystallizes all active shards to the current timestamp. The same
operation also runs automatically once per hour.

---

## Seed Data

The seed script creates:

- Four active demo wallets with realistic shard patterns
- A seeded `ProtocolConfig`
- Leaderboard-only filler wallets so the frontend has a populated leaderboard

Primary demo wallets:

- `0x1111111111111111111111111111111111111111`
- `0x2222222222222222222222222222222222222222`
- `0x3333333333333333333333333333333333333333`
- `0x4444444444444444444444444444444444444444`

The seed script resets the mock database before inserting data.

---

## Numeric Policy

All token quantities, USD principals, rates, and points are stored as decimal
strings. Services convert them to native `bigint` before doing math.

- Token/source quantities use the source asset decimals.
- USD principal is stored as `1e18` fixed-point raw units.
- Multipliers are stored as `1e18` fixed-point raw units.
- Points are returned as raw strings and formatted decimal strings.
- Final point output is divided by `100_000` to keep mock totals readable.

`viem` is used for address normalization and unit parsing/formatting ergonomics.

### Points Math Files

Two files are especially important because they define the entire points engine:

- [`src/points/math/accrual.ts`](./src/points/math/accrual.ts)
  - Implements the time multiplier integral.
  - Calculates shard point deltas between two timestamps.
  - Applies the final points normalization divisor.

- [`src/points/math/fixed-point.ts`](./src/points/math/fixed-point.ts)
  - Defines fixed-point scale constants like `SCALE` and `ONE`.
  - Defines the default multiplier parameters used by tests.
  - Defines `POINTS_NORMALIZATION_DIVISOR`.
  - Provides exact `bigint` helpers for multiplication, division, and square
    root.

Any change to these files changes how points are calculated across the whole
backend. Update the accrual tests when changing them:

```bash
yarn test
```

---

## Current Caveats

- Mutation APIs are public because this is a mock backend.
- Deposit USD value is trusted from the payload.
- Withdrawals currently match active shards by `userAddress`, `entrypoint`,
  `sourceAsset`, and `sourceDecimals`.
- The leaderboard is all-time only and uses stored crystallized points.
- Virtual reads are for display and do not mutate state.
- No event replay means seed withdrawals are not modeled as historical events.
