const QUANTITY_SCALE = 1000;

export function isValidQuantity(value: number, allowZero = false): boolean {
  if (!Number.isFinite(value)) return false;
  if (allowZero ? value < 0 : value <= 0) return false;
  return Math.abs(value * QUANTITY_SCALE - Math.round(value * QUANTITY_SCALE)) < 1e-7;
}
