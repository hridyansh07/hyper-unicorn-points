import {
  fixedMul,
  fixedSqrt,
  ONE,
  POINTS_NORMALIZATION_DIVISOR,
  SCALE,
} from './fixed-point';

export function integratedTimeMultiplierRaw(
  ageStartSeconds: bigint,
  ageEndSeconds: bigint,
  mMaxRaw: bigint,
  tCapSeconds: bigint,
): bigint {
  if (ageEndSeconds < ageStartSeconds) {
    throw new Error('ageEndSeconds must be greater than or equal to ageStartSeconds');
  }

  if (ageEndSeconds === ageStartSeconds) {
    return 0n;
  }

  if (ageEndSeconds <= tCapSeconds) {
    return rampAntiderivative(ageEndSeconds, mMaxRaw, tCapSeconds) -
      rampAntiderivative(ageStartSeconds, mMaxRaw, tCapSeconds);
  }

  if (ageStartSeconds >= tCapSeconds) {
    return fixedMul(mMaxRaw, (ageEndSeconds - ageStartSeconds) * SCALE);
  }

  return (
    rampAntiderivative(tCapSeconds, mMaxRaw, tCapSeconds) -
    rampAntiderivative(ageStartSeconds, mMaxRaw, tCapSeconds) +
    fixedMul(mMaxRaw, (ageEndSeconds - tCapSeconds) * SCALE)
  );
}

export function accruedPointsRaw(
  principalUsdRaw: bigint,
  lockedRateRaw: bigint,
  ageStartSeconds: bigint,
  ageEndSeconds: bigint,
  mMaxRaw: bigint,
  tCapSeconds: bigint,
): bigint {
  const integral = integratedTimeMultiplierRaw(
    ageStartSeconds,
    ageEndSeconds,
    mMaxRaw,
    tCapSeconds,
  );

  return (
    fixedMul(fixedMul(principalUsdRaw, lockedRateRaw), integral) /
    POINTS_NORMALIZATION_DIVISOR
  );
}

function rampAntiderivative(
  ageSeconds: bigint,
  mMaxRaw: bigint,
  tCapSeconds: bigint,
): bigint {
  const kRaw = mMaxRaw - ONE;
  const ageRaw = ageSeconds * SCALE;
  const ratioRaw = (ageSeconds * SCALE) / tCapSeconds;
  const sqrtRatioRaw = fixedSqrt(ratioRaw);
  const rampIncreaseRaw =
    fixedMul(fixedMul(2n * kRaw, ageRaw), sqrtRatioRaw) / 3n;

  return ageRaw + rampIncreaseRaw;
}
