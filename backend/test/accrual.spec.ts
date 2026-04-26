import {
  accruedPointsRaw,
  integratedTimeMultiplierRaw,
} from '../src/points/math/accrual';
import {
  DEFAULT_M_MAX_RAW,
  DEFAULT_T_CAP_SECONDS,
  ONE,
  POINTS_NORMALIZATION_DIVISOR,
} from '../src/points/math/fixed-point';

describe('accrual math', () => {
  it('integrates the ramp phase at tCap to 360 scaled days for default params', () => {
    const days180 = BigInt(DEFAULT_T_CAP_SECONDS);
    const integral = integratedTimeMultiplierRaw(
      0n,
      days180,
      DEFAULT_M_MAX_RAW,
      days180,
    );

    expect(integral).toBe(360n * 24n * 60n * 60n * ONE);
  });

  it('uses plateau math after the cap', () => {
    const cap = BigInt(DEFAULT_T_CAP_SECONDS);
    const oneDay = 24n * 60n * 60n;
    const integral = integratedTimeMultiplierRaw(
      cap,
      cap + oneDay,
      DEFAULT_M_MAX_RAW,
      cap,
    );

    expect(integral).toBe((25n * oneDay * ONE) / 10n);
  });

  it('matches the closed-form integral at tCap for non-default M_max', () => {
    // For M_max = 2.0 (k = 1.0), I(0, T) = T + (2/3) * T = (5/3) * T.
    const mMaxRaw = 2n * ONE;
    const tCapSeconds = BigInt(DEFAULT_T_CAP_SECONDS);
    const integral = integratedTimeMultiplierRaw(
      0n,
      tCapSeconds,
      mMaxRaw,
      tCapSeconds,
    );
    const expected = (5n * tCapSeconds * ONE) / 3n;

    // Tolerate at most 1 unit of last-place rounding from the integer sqrt.
    const diff = integral > expected ? integral - expected : expected - integral;
    expect(diff <= 1n).toBe(true);
  });

  it('computes default direct accrual without floating point', () => {
    const principal = 100n * ONE;
    const oneDay = 24n * 60n * 60n;

    const points = accruedPointsRaw(
      principal,
      ONE,
      0n,
      oneDay,
      DEFAULT_M_MAX_RAW,
      BigInt(DEFAULT_T_CAP_SECONDS),
    );

    expect(points > (principal * oneDay) / POINTS_NORMALIZATION_DIVISOR).toBe(
      true,
    );
  });

  it('normalizes final point output by the configured divisor', () => {
    const principal = 100n * ONE;
    const oneDay = 24n * 60n * 60n;
    const points = accruedPointsRaw(
      principal,
      ONE,
      BigInt(DEFAULT_T_CAP_SECONDS),
      BigInt(DEFAULT_T_CAP_SECONDS) + oneDay,
      DEFAULT_M_MAX_RAW,
      BigInt(DEFAULT_T_CAP_SECONDS),
    );
    const unnormalizedPlateauPoints =
      (principal * DEFAULT_M_MAX_RAW * oneDay) / ONE;

    expect(points).toBe(
      unnormalizedPlateauPoints / POINTS_NORMALIZATION_DIVISOR,
    );
  });
});
