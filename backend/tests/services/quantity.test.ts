import { isValidQuantity } from '../../src/utils/quantity';

describe('inventory quantity precision', () => {
  it.each([0.25, 0.5, 1, 2.375])('accepts %s base units', (quantity) => {
    expect(isValidQuantity(quantity)).toBe(true);
  });

  it('rejects zero, negative, non-finite, and over-precision quantities', () => {
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(-0.25)).toBe(false);
    expect(isValidQuantity(Number.NaN)).toBe(false);
    expect(isValidQuantity(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidQuantity(0.0001)).toBe(false);
  });

  it('allows zero only for received and counted quantities', () => {
    expect(isValidQuantity(0, true)).toBe(true);
    expect(isValidQuantity(-0.001, true)).toBe(false);
  });
});
