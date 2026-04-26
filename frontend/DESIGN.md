# Frontend Design Notes

## Assumptions

I made these assumptions while designing the frontend:

- This is a demo interface for a points system, not a production wallet app.
- The user should understand the incentives without reading the backend code.
- The four seeded wallets are teaching tools, so switching personas should be
  easy and visible.
- The backend is the source of truth for point totals and shard state.
- The UI should favor clarity over maximum density.
- Historical withdrawal drops are desirable, but need backend event history or
  snapshots to be fully accurate.

---

## Overview

The frontend has two jobs:

1. Show the user's current points state.
2. Explain why that state exists.

The dashboard focuses on the personal loop:

- total points
- current earning speed
- active deposit shards
- closed deposit shards
- charted point behavior
- manual withdraw testing

The leaderboard focuses on social context:

- current rank
- tier ladder
- all-time ranking
- manual crystallization for the mock flow

---

## Design Philosophy: Make the Math Feel Observable

The points system has a lot of invisible state: locked rates, time multipliers,
per-shard accrual, virtual points, and LIFO withdrawals.

The frontend should not hide that complexity entirely. Instead, it should make
the important parts observable in small, friendly pieces.

That is why the interface centers around three visual ideas:

- **A chart** for time and trajectory
- **Shard cards** for per-deposit accounting
- **Personas** for understanding different user behaviors

The aim is not to overwhelm the user with formulas. The aim is to give them
enough structure that the formulas feel predictable.

---

## Core Principles

### 1. The user should always know the source of a number

Large numbers need labels and context.

The dashboard headline shows total points. Deposit cards separate:

- current earning rate
- effective multiplier
- cumulative earned points
- principal and age

This prevents the common points-dashboard problem where every number looks
important but none of them explains itself.

### 2. Shards are a product concept, not just a database concept

The backend tracks deposits as independent shards because each one has its own
age and locked rate. The UI keeps that model visible.

Each active deposit card is intentionally small but inspectable. Clicking a
card isolates that shard on the chart, which helps users understand that one
wallet can contain several independent earning streams.

### 3. Demo users should feel like test personas

The wallet switcher is not a raw address dropdown. It is a persona picker.

Each seeded wallet represents a behavior:

- whale vault depositor
- vault DCA depositor
- mixed direct and vault depositor
- high-frequency direct LP

That makes the UI easier to evaluate because each wallet has a reason to exist.

### 4. Controls should live where the question appears

The range and metric toggles live in the chart header because they answer chart
questions:

- what time window am I looking at?
- am I looking at cumulative points or daily points?

The withdraw action floats on the dashboard because it changes the dashboard's
active shard state.

### 5. Mock actions should still use real contracts

The withdraw modal is a demo control, but it submits the actual backend withdraw
DTO. The user only edits amount and occurred-at time; the app derives the rest
from the selected active source.

This keeps the mock interface honest without making the form feel like an API
console.

---

## Visual Direction

The UI uses a warm, parchment-like background with dashed borders and compact
mono labels.

This was a deliberate choice:

- Warm surfaces make the dense data feel less mechanical.
- Dashed borders suggest a wireframe/protocol-lab feel.
- Purple remains the main points/accent color.
- Green marks vault/active-positive states.
- Small mono labels make technical metadata scannable.

The app avoids heavy marketing sections. It starts with the actual product
surface because this is an operational dashboard, not a landing page.

---

## Important Tradeoffs

### Chart clarity vs. historical accuracy

The chart now supports total points and daily points. Total mode is anchored to
the backend current value; daily mode shows the sqrt ramp and plateau more
clearly.

True historical withdrawal drops are intentionally not faked. The backend needs
event history or snapshots before the UI can draw those honestly.

### Friendly inputs vs. raw API control

The withdraw modal hides most DTO fields. This is better for a user-facing demo,
but it means advanced testing still belongs in API tools or backend tests.

### Compact cards vs. complete accounting

Shard cards show the most important details, not every backend field. The goal
is to explain behavior at a glance, then let the chart and modals provide the
next layer of detail.

---

## Extension Principles

When adding new frontend features, prefer:

- backend-backed values over local mock calculations
- explicit labels over mystery numbers
- small controls close to the thing they affect
- persona-driven demos over generic sample data
- honest limitations over fake precision

Avoid adding:

- hidden business rules in components
- raw API forms unless the feature is explicitly admin/testing focused
- chart behavior that implies history the backend does not store
- unrelated visual styles that break the warm/dashed system

---

## Final Thought

The frontend should make loyalty visible.

The backend defines the rules, but the interface gives those rules texture:
deposits age, multipliers grow, points compound, withdrawals crystallize, and
rank becomes a result of behavior over time.
