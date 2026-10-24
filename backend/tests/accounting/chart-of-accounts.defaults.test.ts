import { ACCOUNT_MAPPING_DEFINITIONS, DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_CODES } from '../../src/modules/accounting/chart-of-accounts.defaults';

describe('accountant default chart', () => {
  it('contains the accountant account codes plus documented technical clearing accounts', () => {
    const codes = new Set(DEFAULT_ACCOUNTS.map((account) => account.code));
    for (const code of [
      '1100', '1110', '1120', '1200', '1300', '1310', '1320', '1400', '1500', '1510', '1590',
      '2100', '2110', '2200', '2210', '2300', '2400', '2500',
      '3100', '3200', '3300', '3400',
      '4100', '4200', '4300', '4400', '4500',
      '5100', '5200', '5300', '5400',
      '6100', '6200', '6300', '6400', '6500',
      '3900', '4190', '5500',
    ]) {
      expect(codes.has(code)).toBe(true);
    }
  });

  it('maps operational roles to accountant-approved leaf codes', () => {
    expect(DEFAULT_ACCOUNT_CODES.CASH).toBe('1110');
    expect(DEFAULT_ACCOUNT_CODES.BANK).toBe('1120');
    expect(DEFAULT_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE).toBe('1200');
    expect(DEFAULT_ACCOUNT_CODES.INVENTORY_OILS).toBe('1300');
    expect(DEFAULT_ACCOUNT_CODES.INVENTORY_PARTS).toBe('1310');
    expect(DEFAULT_ACCOUNT_CODES.INVENTORY_PROTECTION).toBe('1320');
    expect(DEFAULT_ACCOUNT_CODES.ACCOUNTS_PAYABLE).toBe('2110');
    expect(DEFAULT_ACCOUNT_CODES.SERVICE_REVENUE).toBe('4100');
    expect(DEFAULT_ACCOUNT_CODES.PARTS_REVENUE).toBe('4200');
    expect(DEFAULT_ACCOUNT_CODES.PROTECTION_REVENUE).toBe('4300');
    expect(DEFAULT_ACCOUNT_CODES.WASH_REVENUE).toBe('4400');
    expect(DEFAULT_ACCOUNT_CODES.INSPECTION_REVENUE).toBe('4500');
    expect(DEFAULT_ACCOUNT_CODES.DIRECT_LABOR).toBe('5400');
  });

  it('defines an editable posting role for every default account role', () => {
    const roles = new Set(ACCOUNT_MAPPING_DEFINITIONS.map((definition) => definition.key));
    expect(Object.keys(DEFAULT_ACCOUNT_CODES).every((role) => roles.has(role as any))).toBe(true);
  });
});
