import { buffetLinePrices } from '../../src/modules/buffet/booking-lines';

describe('buffet prices follow the invoice engine', () => {
  it('uses USD as the base when both currencies are set', () => {
    expect(buffetLinePrices({ priceSYP: 2800, priceUSD: 20 }, 139)).toEqual({ priceSYP: 2780, priceUSD: 20 });
  });

  it('derives USD from SYP when only SYP is set', () => {
    expect(buffetLinePrices({ priceSYP: 2000, priceUSD: null }, 139)).toEqual({ priceSYP: 2000, priceUSD: 14.39 });
  });

  it('derives SYP from USD when only USD is set', () => {
    expect(buffetLinePrices({ priceSYP: 0, priceUSD: 10 }, 139)).toEqual({ priceSYP: 1390, priceUSD: 10 });
  });

  it('keeps the stored values when no exchange rate is configured', () => {
    expect(buffetLinePrices({ priceSYP: 2000, priceUSD: null }, 0)).toEqual({ priceSYP: 2000, priceUSD: 0 });
  });
});
