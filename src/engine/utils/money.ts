export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function clampMoney(value: number, minimum = 0, maximum = Number.POSITIVE_INFINITY): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(maximum, Math.max(minimum, roundMoney(value)));
}

export function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((sum, value) => sum + value, 0));
}

export function annualizeMonthlyAmount(monthlyAmount: number): number {
  return roundMoney(monthlyAmount * 12);
}

export function percentageOf(part: number, whole: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) {
    return 0;
  }

  return roundMoney((part / whole) * 100);
}