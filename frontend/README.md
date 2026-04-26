# HyperUnicorn Points Frontend

React/Vite frontend for the HyperUnicorn points demo.

This app is the user-facing layer for the points system described in the root
README and backend docs. It is intentionally small, but it tries to make the
core mechanics feel legible: points accrue over time, deposits age as separate
shards, vault and direct positions behave differently, and withdrawals affect
the active shard set.

For the design rationale behind the interface, see [DESIGN.md](./DESIGN.md).

---

## What We Built

### Implemented

- Dashboard route at `/dashboard`
- Leaderboard route at `/leaderboard`
- Backend-backed point totals, shards, and leaderboard reads
- Seeded wallet/persona switcher for the four demo users
- Active deposit cards with current earning rate, effective multiplier, and earned points
- Closed deposit cards for withdrawn shards
- Chart metric toggle between total points and daily points
- Chart range toggle for `1W`, `1M`, `3M`, and `ALL`
- Shard isolation by clicking a deposit card
- Withdraw modal that submits the backend `WithdrawEventDto`
- Manual crystallize action on the leaderboard page
- Shared leaderboard context so the top bar and leaderboard agree
- SVG favicon using the HyperUnicorn `H` mark

### Intentionally Not Built

- Wallet connection or auth
- Real chain/indexer integration
- Event history charting for true withdrawal drops
- Weekly/monthly leaderboard windows
- Production-grade forms, toasts, or modals
- Full design system package

Those are good follow-up layers, but they were left out to keep the take-home
frontend focused on explaining the points model.

---

## Stack

- React 19
- React Router
- Vite
- TypeScript
- Tailwind CSS v4
- Native `fetch`
- Backend proxy through Vite at `/v1`

---

## Setup

From the repo root, Docker Compose starts the backend and frontend together:

```bash
docker compose up
```

For frontend-only local development:

```bash
cd frontend
yarn install
yarn dev
```

The Vite dev server defaults to:

```text
http://localhost:5173
```

The frontend expects the backend at `localhost:3001`; Vite proxies `/v1` to that
backend in [vite.config.ts](./vite.config.ts).

---

## Scripts

```bash
yarn dev        # run Vite in development mode
yarn build      # typecheck and build production assets
yarn preview    # preview the production build
yarn typecheck  # run TypeScript without emitting
```

---

## App Structure

```text
src/
  pages/        Dashboard and Leaderboard screens
  components/   Cards, chart, top bar, toggles, and modals
  lib/          API client, adapters, math, formatting, personas
  state/        Active wallet and leaderboard context providers
```

The app has two top-level routes:

```text
/dashboard
/leaderboard
```

`/dashboard` is the primary product surface. `/leaderboard` gives rank context
and includes a mock crystallization action for demo/testing.

---

## API Usage

The frontend reads:

```http
GET /v1/users/:address/points
GET /v1/users/:address/shards
GET /v1/leaderboard
```

The frontend writes:

```http
POST /v1/events/withdraw
POST /v1/admin/crystallize
```

The withdraw form intentionally exposes only the fields a demo user should
touch: source selection, amount, and occurred-at time. The rest of the DTO is
derived from the selected active shard source.

---

## Current Limitations

- The chart can toggle between total points and daily points, but it does not
  render true historical withdrawal drops because the backend does not store an
  append-only event log or point snapshots yet.
- Weekly and monthly leaderboard tabs exist as product placeholders, but the
  backend currently serves all-time rankings.
- The UI is optimized for demo clarity, not production wallet security or
  permissioning.

---

## What I Would Improve With More Time

1. Add event history or snapshots so the chart can show true withdrawal drops.
2. Align every displayed earning rate with backend-normalized point units.
3. Add stronger loading and empty states.
4. Add browser-level interaction tests for the chart, modal, and withdraw flow.
5. Promote repeated modal/card patterns into a small local UI kit.
6. Add real weekly/monthly leaderboard windows once the backend supports them.

---

## Final Thought

The frontend is not just a dashboard. It is a teaching layer for the incentives.

The goal is that a user can look at the screen and understand:

- what they have earned
- why they are earning at that speed
- how time changes their position
- what happens when liquidity is withdrawn

That clarity matters as much as the mechanics.
