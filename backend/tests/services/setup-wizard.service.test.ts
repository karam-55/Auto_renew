export {};

const prismaMock: any = {
  tenant: { findUnique: jest.fn() },
  companySettings: { upsert: jest.fn() },
  currency: {
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};
const initializeDefaultDepartmentsMock = jest.fn();

jest.doMock('../../src/config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));
jest.doMock('../../src/modules/accounting/automatic-journal-entries', () => ({
  createJournalEntry: jest.fn(),
  ensureDefaultAccounts: jest.fn(),
}));
jest.doMock('../../src/shared/utils/auth', () => ({
  hashPassword: jest.fn(),
  generateTokens: jest.fn(),
}));
jest.doMock('../../src/modules/services/service-category.service', () => ({
  ServiceCategoryService: jest.fn().mockImplementation(() => ({
    initializeDefaultDepartments: initializeDefaultDepartmentsMock,
  })),
}));

const { SetupWizardService } = require('../../src/modules/setup-wizard/service');
const authMock = require('../../src/shared/utils/auth');

describe('SetupWizardService company settings persistence', () => {
  const service = new SetupWizardService();

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.tenant.findUnique.mockResolvedValue({
      name: 'Auto Renew',
      nameAr: 'أوتو رينيو',
      nameEn: 'Auto Renew',
    });
    prismaMock.companySettings.upsert.mockResolvedValue({});
    prismaMock.currency.findFirst.mockResolvedValue(null);
    prismaMock.currency.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.currency.update.mockResolvedValue({});
    initializeDefaultDepartmentsMock.mockResolvedValue([]);
    prismaMock.$transaction.mockImplementation((callback: any) => callback({
      tenant: prismaMock.tenant,
      companySettings: prismaMock.companySettings,
      currency: { upsert: jest.fn().mockResolvedValue({ id: 'currency-usd' }) },
      fiscalPeriod: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
    }));
  });

  it('creates settings during step one if the settings row is missing', async () => {
    await service.saveStep1('default', {
      companyName: 'Auto Renew',
      currency: 'SYP',
      timezone: 'Asia/Damascus',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    });

    expect(prismaMock.companySettings.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'default' },
      create: expect.objectContaining({
        tenantId: 'default',
        companyName: 'Auto Renew',
        setupStep: 1,
      }),
      update: expect.objectContaining({
        companyName: 'Auto Renew',
        setupStep: 1,
      }),
    }));
  });

  it('creates default USD and SYP currencies during fresh system initialization', async () => {
    const tenant = { id: 'default', name: 'Auto Renew', nameAr: 'أوتو رينيو', nameEn: 'Auto Renew' };
    const branch = { id: 'branch-1', tenantId: 'default' };
    const user = { id: 'owner-1', tenantId: 'default', role: 'OWNER', username: 'owner' };
    const currencyUpsert = jest.fn()
      .mockResolvedValueOnce({ id: 'currency-usd' })
      .mockResolvedValueOnce({ id: 'currency-syp' });
    const tx: any = {
      tenant: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue(tenant) },
      branch: { create: jest.fn().mockResolvedValue(branch) },
      user: { create: jest.fn().mockResolvedValue(user) },
      companySettings: { create: jest.fn().mockResolvedValue({}) },
      currency: { upsert: currencyUpsert },
    };
    prismaMock.$transaction.mockImplementationOnce((callback: any) => callback(tx));
    authMock.hashPassword.mockResolvedValueOnce('hashed-password');
    authMock.generateTokens.mockReturnValueOnce({ accessToken: 'access', refreshToken: 'refresh' });

    await service.init({
      tenantName: 'Auto Renew',
      branchName: 'الفرع الرئيسي',
      adminFullName: 'مالك تجريبي',
      adminUsername: 'owner-demo',
      adminPassword: 'secure-demo-password',
    });

    expect(currencyUpsert).toHaveBeenCalledTimes(2);
    expect(currencyUpsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { code: 'USD' },
      create: expect.objectContaining({ tenantId: 'default', code: 'USD', isDefault: true }),
    }));
    expect(currencyUpsert).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { code: 'SYP' },
      create: expect.objectContaining({ tenantId: 'default', code: 'SYP', isDefault: false }),
    }));
    expect(tx.companySettings.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ defaultCurrencyId: 'currency-usd' }),
    }));
  });

  it('creates settings transactionally during step two if the row is missing', async () => {
    await service.saveStep2('default', {
      exchangeRate: 14000,
      taxRate: 0,
      overheadPercentage: 0,
      monthlyWorkingHours: 600,
      serviceOverheadPercent: 0,
      invoicePrefix: 'INV',
      autoGenerateInvoiceNumber: true,
      fiscalPeriodName: '',
      fiscalStartDate: '',
      fiscalEndDate: '',
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.companySettings.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'default' },
      create: expect.objectContaining({
        tenantId: 'default',
        companyName: 'Auto Renew',
        exchangeRate: 14000,
        setupStep: 2,
      }),
      update: expect.objectContaining({
        exchangeRate: 14000,
        setupStep: 2,
      }),
    }));
  });

  it('reports a clear setup error if no tenant exists', async () => {
    prismaMock.tenant.findUnique.mockResolvedValueOnce(null);

    await expect(service.saveStep1('default', {
      companyName: 'Auto Renew',
      currency: 'SYP',
      timezone: 'Asia/Damascus',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    })).rejects.toThrow('لم يتم إنشاء المنشأة بعد');

    expect(prismaMock.companySettings.upsert).not.toHaveBeenCalled();
  });

  it('sets the selected setup currency as the company default', async () => {
    prismaMock.currency.findFirst.mockResolvedValueOnce({ id: 'currency-syp' });

    await service.saveStep1('default', {
      companyName: 'Auto Renew',
      currency: 'SYP',
      timezone: 'Asia/Damascus',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    });

    expect(prismaMock.companySettings.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ defaultCurrencyId: 'currency-syp' }),
    }));
    expect(prismaMock.currency.updateMany).toHaveBeenCalledWith({
      where: { tenantId: 'default', isDefault: true },
      data: { isDefault: false },
    });
    expect(prismaMock.currency.update).toHaveBeenCalledWith({
      where: { id: 'currency-syp' },
      data: { isDefault: true },
    });
  });

  it('initializes the standard service catalog before marking setup complete', async () => {
    await service.complete('default');

    expect(initializeDefaultDepartmentsMock).toHaveBeenCalledWith('default');
    expect(prismaMock.companySettings.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: { setupCompleted: true, setupStep: 7 },
    }));
  });
});
