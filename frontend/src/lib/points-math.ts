// Points spec — time multiplier and its closed-form integral.
//   time_mult(a) = 1 + 1.5 * sqrt(min(a/T_cap, 1))
//   F(a) = a + (1/sqrt(T)) * a^(3/2)   (ramp antiderivative)

export const T_CAP_DAYS = 180;
export const M_MAX = 2.5;

export function timeMult(ageDays: number): number {
  return 1 + 1.5 * Math.sqrt(Math.min(ageDays / T_CAP_DAYS, 1));
}

export function integralTimeMult(a1: number, a2: number): number {
  const T = T_CAP_DAYS;
  const F = (a: number) => a + (1 / Math.sqrt(T)) * Math.pow(a, 1.5);
  if (a2 <= T) return F(a2) - F(a1);
  if (a1 >= T) return M_MAX * (a2 - a1);
  return F(T) - F(a1) + M_MAX * (a2 - T);
}
