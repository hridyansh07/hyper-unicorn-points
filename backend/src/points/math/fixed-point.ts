export const SCALE = 10n ** 18n;
export const ONE = SCALE;
export const DEFAULT_M_MAX_RAW = 25n * 10n ** 17n;
export const DEFAULT_T_CAP_SECONDS = 180 * 24 * 60 * 60;

// Since points are accumulated per second we use a normalization factor to ensure 
// Points don't grow to absurd levels alternatively use minutes instead of seconds with a smaller factor
// This factor can also be the pro-rata rate at TGE for conversion of points to tokens
export const POINTS_NORMALIZATION_DIVISOR = 100_000n;

export function fixedMul(a: bigint, b: bigint): bigint {
  return (a * b) / SCALE;
}

export function fixedDiv(a: bigint, b: bigint): bigint {
  if (b === 0n) {
    throw new Error('fixedDiv division by zero');
  }

  return (a * SCALE) / b;
}

export function integerSqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new Error('integerSqrt only accepts non-negative values');
  }

  if (value < 2n) {
    return value;
  }

  let x0 = value / 2n;
  let x1 = (x0 + value / x0) / 2n;

  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + value / x0) / 2n;
  }

  return x0;
}

export function fixedSqrt(value: bigint): bigint {
  return integerSqrt(value * SCALE);
}
