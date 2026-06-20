import { describe, test, expect, beforeAll } from '@jest/globals';
import request, { Test } from 'supertest';
import { app } from '../../src/server';

const uniqueId = () => Math.random().toString(36).substring(2, 10);

describe('Accounting Module Integration Tests', () => {
  let authToken = '';
  let tenantId = '';
  let journalFiscalPeriodId = '';
  let debitAccountId = '';
  let creditAccountId = '';
  let defaultCustomerId = '';
  let chartAccountId = '';
  let createdCurrencyId = '';
  let secondaryCurrencyId = '';
  let createdJournalEntryId = '';
  let createdChequeId = '';
  let createdInstallmentPlanId = '';

  const withAuth = (req: Test) => req.set('Authorization', `Bearer ${authToken}`);

  const createAccount = async (code: string, nameAr: string, nameEn: string, accountType: string) => {
    const response = await withAuth(request(app).post('/api/accounts')).send({
      code,
      nameAr,
      nameEn,
      accountType,
      isActive: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    return response.body.data.id as string;
  };

  const createFiscalPeriod = async () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1).toISOString();
    const endDate = new Date(now.getFullYear(), 11, 31).toISOString();

    const response = await withAuth(request(app).post('/api/fiscal-periods')).send({
      name: `Fiscal Period ${uniqueId()}`,
      startDate,
      endDate,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    return response.body.data.id as string;
  };

  const createCustomer = async () => {
    const response = await withAuth(request(app).post('/api/customers')).send({
      fullName: `Test Customer ${uniqueId()}`,
      phone: `+9639${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: 'Damascus',
      city: 'Damascus',
    });

    expect(response.status).toBe(201);
    return response.body.customer.id as string;
  };

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123', tenantId: 'default' });

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body?.tokens?.accessToken;
    tenantId = loginResponse.body?.user?.tenantId;
    expect(authToken).toBeTruthy();
    expect(tenantId).toBeTruthy();

    debitAccountId = await createAccount(`1000-${uniqueId()}`, 'حساب نقدي', 'Cash Account', 'ASSET');
    creditAccountId = await createAccount(`2000-${uniqueId()}`, 'حساب الإيرادات', 'Revenue Account', 'REVENUE');
    journalFiscalPeriodId = await createFiscalPeriod();
    defaultCustomerId = await createCustomer();
  });

  describe('Chart of Accounts', () => {
    test('should create a new account', async () => {
      const response = await withAuth(request(app).post('/api/accounts')).send({
        code: `ACC-${uniqueId()}`,
        nameAr: 'حساب تجريبي',
        nameEn: 'Test Account',
        accountType: 'ASSET',
        isActive: true,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toMatch(/ACC/);

      chartAccountId = response.body.data.id;
    });

    test('should get account tree', async () => {
      const response = await withAuth(request(app).get('/api/accounts/tree'));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should update an account', async () => {
      const response = await withAuth(request(app).put(`/api/accounts/${chartAccountId}`)).send({
        nameAr: 'حساب محدث',
        nameEn: 'Updated Account',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nameEn).toBe('Updated Account');
    });
  });

  describe('Fiscal Periods', () => {
    let createdFiscalPeriodId = '';

    test('should create a fiscal period', async () => {
      const response = await withAuth(request(app).post('/api/fiscal-periods')).send({
        name: `Fiscal ${uniqueId()}`,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-12-31T00:00:00.000Z',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('Fiscal');

      createdFiscalPeriodId = response.body.data.id;
    });

    test('should get all fiscal periods', async () => {
      const response = await withAuth(request(app).get('/api/fiscal-periods'));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should close a fiscal period', async () => {
      const response = await withAuth(request(app).post(`/api/fiscal-periods/${createdFiscalPeriodId}/close`));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CLOSED');
    });
  });

  describe('Journal Entries', () => {
    test('should create a manual journal entry', async () => {
      const response = await withAuth(request(app).post('/api/journal-entries')).send({
        fiscalPeriodId: journalFiscalPeriodId,
        entryDate: new Date().toISOString(),
        description: 'Test journal entry',
        lines: [
          {
            accountId: debitAccountId,
            description: 'Test debit',
            debitSYP: 100,
            creditSYP: 0,
          },
          {
            accountId: creditAccountId,
            description: 'Test credit',
            debitSYP: 0,
            creditSYP: 100,
          },
        ],
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('POSTED');

      createdJournalEntryId = response.body.data.id;
    });

    test('should get journal entries with filters', async () => {
      const response = await withAuth(request(app).get('/api/journal-entries')).query({ status: 'POSTED' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should get journal entry by ID', async () => {
      const response = await withAuth(request(app).get(`/api/journal-entries/${createdJournalEntryId}`));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdJournalEntryId);
    });

    test('should reject unbalanced journal entry', async () => {
      const response = await withAuth(request(app).post('/api/journal-entries')).send({
        fiscalPeriodId: journalFiscalPeriodId,
        entryDate: new Date().toISOString(),
        description: 'Unbalanced entry',
        lines: [
          {
            accountId: debitAccountId,
            description: 'Unbalanced debit',
            debitSYP: 100,
            creditSYP: 0,
          },
          {
            accountId: creditAccountId,
            description: 'Unbalanced credit',
            debitSYP: 0,
            creditSYP: 90,
          },
        ],
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Currencies', () => {
    test('should create a currency', async () => {
      const response = await withAuth(request(app).post('/api/currencies')).send({
        code: `USD-${uniqueId()}`,
        name: 'US Dollar',
        nameAr: 'دولار أمريكي',
        nameEn: 'US Dollar',
        symbol: '$',
        isDefault: false,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toContain('USD');

      createdCurrencyId = response.body.data.id;
    });

    test('should create exchange rate', async () => {
      if (!secondaryCurrencyId) {
        const secondaryResponse = await withAuth(request(app).post('/api/currencies')).send({
          code: `EUR-${uniqueId()}`,
          name: 'Euro',
          nameAr: 'يورو',
          nameEn: 'Euro',
          symbol: '€',
          isDefault: false,
        });

        expect(secondaryResponse.status).toBe(201);
        secondaryCurrencyId = secondaryResponse.body.data.id;
      }

      const response = await withAuth(request(app).post('/api/currencies/exchange-rates')).send({
        fromCurrencyId: createdCurrencyId,
        toCurrencyId: secondaryCurrencyId,
        rate: 12500,
        effectiveDate: new Date().toISOString(),
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.rate).toBe(12500);
    });
  });

  describe('Cheques', () => {
    test('should create a received cheque', async () => {
      const response = await withAuth(request(app).post('/api/cheques')).send({
        chequeNumber: `CHQ-${uniqueId()}`,
        chequeType: 'RECEIVED',
        bankName: 'Test Bank',
        amountSYP: 5000,
        currency: 'SYP',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        issueDate: new Date().toISOString(),
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PENDING');

      createdChequeId = response.body.data.id;
    });

    test('should deposit a cheque', async () => {
      const response = await withAuth(request(app).post(`/api/cheques/${createdChequeId}/deposit`));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DEPOSITED');
    });
  });

  describe('Installments', () => {
    test('should create an installment plan', async () => {
      const response = await withAuth(request(app).post('/api/installments/plans')).send({
        customerId: defaultCustomerId,
        totalAmountSYP: 12000,
        downPaymentSYP: 2000,
        numberOfPayments: 12,
        interestRate: 5,
        currency: 'SYP',
        startDate: new Date().toISOString(),
        paymentFrequency: 'MONTHLY',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ACTIVE');

      createdInstallmentPlanId = response.body.data.id;
    });

    test('should get installment plan with installments', async () => {
      const response = await withAuth(request(app).get(`/api/installments/plans/${createdInstallmentPlanId}`));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.installments)).toBe(true);
      expect(response.body.data.installments.length).toBe(12);
    });
  });
});
