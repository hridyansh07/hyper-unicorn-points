# 🦄 HyperUnicorn Points System

## Assumptions

I’m stating these upfront because they shape most of the design decisions:

- I expect roughly **~1000 users** over the lifetime of the program.
- The **TGE is ~12 months out**, so the system needs to stay engaging over a long period.
- There is **one vault (ERC-4626)** in v0.1.
- Direct LP is limited to a **known set of pools** with reliable oracle pricing.
- **Stablecoins are treated as $1**, and any depeg is handled via governance (pause), not dynamic repricing.
- The **oracle is trusted at deposit time** (no TWAP/median fallback in v0.1).
- Points **convert to a TGE airdrop** using a pro-rata model.
- The **off-chain indexer is the source of truth** for points and shard state.
- **No retroactive rule changes**: once a deposit is made, its terms are fixed.

---

## How To Run

Ensure Docker and Docker Compose are present

From the repo root:

```bash
docker compose up
```

This starts Postgres, runs backend migrations and seed data, starts the backend,
and starts the frontend.

### Fallback: Run Apps With Package Scripts

If you do not want to run the backend/frontend through Compose, keep Postgres
available and run each app from its own `package.json`.

Create the backend env file:

```bash
cd backend
cp .env.example .env
```

The default backend `.env` is:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/panoptic_points?schema=public"
PORT=3001
```

Then start the backend:

```bash
cd backend
yarn install
yarn prisma:generate
yarn prisma:migrate
yarn prisma:seed
yarn start:dev
```

In a second terminal, start the frontend:

```bash
cd frontend
yarn install
yarn dev
```

The frontend runs on `localhost:5173` and proxies `/v1` API calls to
`localhost:3001` by default.

---

## Overview

This system rewards liquidity providers leading up to TGE.

Users earn points in two ways:
- Providing liquidity directly (LP)
- Depositing into the vault

Points accrue continuously based on:
- Deposit size  
- Deposit age  
- A base rate depending on the entrypoint  

At TGE, all points are snapshotted and the airdrop is distributed **pro-rata**.

This document focuses on *why* the system looks the way it does. The exact mechanics (state model, equations, etc.) live separately.

---

## Design Philosophy: Loyalty Over Capital Efficiency

At its core, this is an LP-driven points system, and that framing shaped most of my decisions.

I made an explicit call early on:  
**this system should reward long-term liquidity and stability more than short-term capital efficiency.**

Capital efficiency matters—but it’s something the **vault is better positioned to optimize** through yield strategies and allocation. The points system has a different job: aligning users with the protocol over time.

---

### Loyalty vs. Competition for Fixed Rewards

This led to a key design question:

- Should users **compete for a fixed pool of points**, fighting for share based on capital?
- Or should users **earn points based on how much and how long they commit**, independent of others?

I chose the second approach.

I wanted to avoid a system where:
- late entrants are structurally disadvantaged  
- large capital dominates outcomes  
- behavior becomes short-term and opportunistic  

Instead, I aimed for a system where:
- **time in the system matters**
- **consistency is rewarded**
- users can **reason about their rewards independently**

This naturally pushed me away from an epoch-based model.

---

### Why I Avoided Epochs

Epoch-based systems are common, but they introduce real friction in this context:

- They turn participation into a **race for a fixed pie**
- They create **cliff effects** where timing dominates behavior
- They’re hard to reason about when users:
  - make multiple deposits  
  - partially withdraw  
  - move positions over time  

They also make **sybil resistance significantly harder**, often requiring caps, thresholds, or identity assumptions.

For this system, that complexity wasn’t worth it.

---

### Continuous Accrual as a Better Fit

A continuous accrual model aligns much better with the goals here:

- Users are rewarded for **staying in**, not just entering at the right time  
- Points scale with both **capital and time**  
- The system remains **intuitive**, even with many deposits  
- Late entrants are not artificially penalized  

Most importantly, it reinforces the behavior I want:

> **Provide liquidity, keep it there, and grow with the protocol.**

---

### Separation of Concerns

I also wanted a clean separation of responsibilities:

- The **vault** handles capital efficiency and yield optimization  
- The **points system** rewards loyalty and stability  

Combining both into one system would create conflicting incentives, so I kept them separate.

---

## Key Design Decisions

### Continuous Accrual

Points grow continuously per user—there are no fixed emission buckets.

**Why:**
- No dilution surprises
- No epoch boundary effects
- Easier mental model

**Tradeoff:**  
Less direct control over emissions, which can be handled later via campaigns if needed.

---

### Per-Deposit Shards with LIFO Withdrawal

Each deposit is tracked independently as a “shard” with:
- its own start time  
- its own locked rate  

Withdrawals consume the newest shards first (LIFO).

**Why:**
- Prevents gaming via deposit averaging  
- Protects long-term positions when users partially withdraw  

**Tradeoff:**  
More state per user, which is acceptable at this scale.

---

### Time Multiplier (Bounded Growth)

The time multiplier grows quickly early and plateaus:

- Max multiplier: **2.5x**
- Reached at: **180 days**

**Why:**
- Rewards early commitment  
- Doesn’t overly punish late entrants  
- Keeps competition alive after long durations  

After 180 days, only new capital meaningfully moves rankings.

---

### Locked Rates Per Deposit

Each shard locks its rate at deposit:
- Direct LP → base rate  
- Vault → current vault multiplier  

Future changes only apply to new deposits.

**Why:**
- Builds trust through predictability  
- Avoids retroactive rule changes  

Users can opt into new rates by redepositing, but they reset their time multiplier.

---

### USD Basis at Deposit

Each deposit is converted to USD at deposit time and then fixed.

**Why:**
- Ensures cross-user comparability  
- Keeps calculations simple  
- Minimizes oracle dependency  

**Tradeoff:**  
Price changes after deposit don’t affect points.

---

### Proportional Withdrawals

Partial withdrawals reduce the shard proportionally.

**Why:**
- Keeps accounting consistent  
- Avoids re-pricing complexity  

---

### Leaderboards (Delta-Based)

Leaderboards run:
- Weekly (top 10)  
- Monthly (top 20)  

Rankings are based on **points earned during the window**, not lifetime totals.

**Why:**
- Keeps the system dynamic  
- Allows new users to compete  

Bonuses are awarded as additional points.

---

### Light Sybil Resistance

No:
- Minimum deposits  
- Wallet caps  

**Why:**
- Linear scaling removes most sybil incentives  
- Only leaderboard rewards are gameable  

Mitigation can happen **post-hoc before TGE** if needed.

---

## What I Intentionally Left Out

These were explored but removed for simplicity:

- **Per-pool multipliers**  
- **Campaign systems (for now)**  
- **Stacking multiple multipliers**  
- **Built-in sybil defenses**  
- **Mark-to-market pricing**

Each added complexity without enough benefit at this stage.

---

## Edge Cases and Considerations

- Multiple deposits → tracked independently  
- Late deposits → naturally limited by time multiplier  
- Vault yield → separate from points  
- Stablecoin depegs → handled via pause  
- Oracle failures → deposit fails  

---

## Current Implementation Status

### Implemented

- Shard-based deposit system  
- LIFO withdrawals  
- Continuous accrual (closed-form)  
- Postgres persistence  
- Per-user point reads  
- Mock seed data for frontend and leaderboard profiling  

---

## Mock Data Availability

The project includes mock data so the backend and frontend can be explored
without connecting to a real chain indexer or oracle.

The seed data currently creates:

- active demo wallets with shard-based LP/vault deposits
- a seeded protocol config
- leaderboard-only wallets with pre-filled point totals
- procedural filler users so the leaderboard feels populated

This mock data is intentionally editable. To change the demo users,
leaderboard distribution, deposit sizes, deposit timing, vault multiplier, or
protocol defaults, update:

```txt
backend/prisma/seed.ts
```

Then reseed the local database:

```bash
cd backend
yarn prisma:seed
```

The root `docker compose` setup also runs the backend seed script during a
fresh backend container start/build, so a fresh Compose run will come up with
mock data already loaded.

The seed script resets the mock database before inserting fresh data, so it is
safe to iterate on when tuning frontend states or demo scenarios.

---

### Not Yet Implemented

- **Snapshots and TGE flow** (critical)  
- **Window-based leaderboards**  
- **Real-time leaderboard accuracy**  
- **Append-only event log**  
- **Invariant enforcement**  

---

## What I’d Improve With More Time

1. Snapshots and TGE flow  
2. Real-time leaderboard accuracy  
3. Proper window-based ranking  
4. Event replay/logging system  
5. Invariant enforcement  
6. Better test coverage  
7. Campaign system  
8. User-facing documentation  

---

## Final Thoughts

This system is intentionally simple in structure but deliberate in incentives.

It prioritizes:
- **Predictability**
- **Fairness across users**
- **Long-term alignment**

Some tradeoffs (like fixed USD basis) are intentional—they keep the system understandable and robust over a long-running program.

The design also leaves room to evolve. More advanced mechanisms (campaigns, tuning, additional incentives) can be layered in later without breaking the foundation.
