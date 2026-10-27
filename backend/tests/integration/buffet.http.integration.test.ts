import { randomUUID } from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import prisma from '../../src/config/database';
import buffetRoutes from '../../src/modules/buffet/routes';
import { ensureDefaultAccounts } from '../../src/modules/accounting/automatic-journal-entries';

const testDatabaseUrl = process.env.TEST_DATABASE_URL || '';
const runDatabaseIntegrationTests = process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true' && testDatabaseUrl.includes('127.0.0.1:55432/buffet_');
const integrationDescribe = runDatabaseIntegrationTests ? describe : describe.skip;
const SECRET = 'buffet-http-test-secret';

integrationDescribe('Buffet HTTP contract (auth, roles, response shapes)', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/buffet', buffetRoutes);
  let tenantId = '';
  let cashierToken = '';
  let receptionistToken = '';
  let employeeId = '';
  let coffeeId = '';

  beforeAll(async () => {
    process.env.JWT_SECRET = SECRET;
    tenantId = (await prisma.tenant.create({ data: { name: `buffet-http-${randomUUID().slice(0, 8)}` } })).id;
    await prisma.companySettings.create({ data: { tenantId, companyName: 'Buffet HTTP', exchangeRate: 139, taxRate: 0 } });
    await prisma.fiscalPeriod.create({ data: { tenantId, name: 'FY http', startDate: new Date('2025-01-01'), endDate: new Date('2030-12-31') } });
    await ensureDefaultAccounts(tenantId);
    const cashier = await prisma.user.create({
      data: { tenantId, fullName: 'كاشير', username: `c-${randomUUID().slice(0, 6)}`, passwordHash: 'x', phone: '0900000002', role: 'CASHIER' },
    });
    const receptionist = await prisma.user.create({
      data: { tenantId, fullName: 'استقبال', username: `r-${randomUUID().slice(0, 6)}`, passwordHash: 'x', phone: '0900000003', role: 'RECEPTIONIST' },
    });
    cashierToken = jwt.sign({ id: cashier.id, tenantId, role: 'CASHIER', username: cashier.username }, SECRET);
    receptionistToken = jwt.sign({ id: receptionist.id, tenantId, role: 'RECEPTIONIST', username: receptionist.username }, SECRET);
    const department = await prisma.department.create({ data: { tenantId, nameAr: 'البوفيه' } });
    employeeId = (await prisma.employee.create({
      data: {
        tenantId, departmentId: department.id, phone: '0900000004', position: 'موظف', hireDate: new Date('2025-01-01'),
        salarySYP: 0, contractType: 'FULL_TIME', employeeCode: 'EMP-HTTP', fullNameAr: 'موظف HTTP',
      },
    })).id;
    coffeeId = (await prisma.part.create({
      data: { tenantId, partNumber: 'PN-HTTP-C', name: 'Coffee', nameAr: 'قهوة', costSYP: 500, sellingPriceSYP: 2000, quantity: 5, barcode: 'HTTP-C-1', isBuffetItem: true },
    })).id;
    await prisma.part.create({
      data: { tenantId, partNumber: 'PN-HTTP-N', name: 'Oil', nameAr: 'زيت', costSYP: 500, sellingPriceSYP: 1000, quantity: 5, barcode: 'HTTP-N-1', isBuffetItem: false },
    });
  });

  it('rejects requests without a token and roles outside the buffet scope', async () => {
    await request(app).get('/api/buffet/items').expect(401);
    await request(app).get('/api/buffet/items').set('Authorization', `Bearer ${receptionistToken}`).set('x-tenant-id', tenantId).expect(403);
  });

  it('lists buffet items with availability and resolves barcodes', async () => {
    const list = await request(app).get('/api/buffet/items').set('Authorization', `Bearer ${cashierToken}`).expect(200);
    expect(list.body.success).toBe(true);
    const coffee = list.body.data.find((item: any) => item.id === coffeeId);
    expect(coffee).toMatchObject({ barcode: 'HTTP-C-1', quantity: 5, reserved: 0, available: 5, sellingPriceSYP: 2000 });
    const byCode = await request(app).get('/api/buffet/items/by-barcode/HTTP-C-1').set('Authorization', `Bearer ${cashierToken}`).expect(200);
    expect(byCode.body.data.id).toBe(coffeeId);
    const notBuffet = await request(app).get('/api/buffet/items/by-barcode/HTTP-N-1').set('Authorization', `Bearer ${cashierToken}`).expect(404);
    expect(notBuffet.body.error.code).toBe('ITEM_NOT_FOUND');
  });

  it('runs an employee sale end to end with stable error codes', async () => {
    const created = await request(app).post('/api/buffet/sales').set('Authorization', `Bearer ${cashierToken}`)
      .send({ buyerType: 'EMPLOYEE', employeeId }).expect(201);
    const saleId = created.body.data.id;
    expect(created.body.data).toMatchObject({ status: 'OPEN', buyerType: 'EMPLOYEE', editable: true, employee: { id: employeeId } });

    const scanned = await request(app).post(`/api/buffet/sales/${saleId}/scan`).set('Authorization', `Bearer ${cashierToken}`)
      .send({ barcode: 'HTTP-C-1' }).expect(200);
    expect(scanned.body.data.lines[0]).toMatchObject({ quantity: 1, priceSYP: 2000, totalSYP: 2000, barcode: 'HTTP-C-1' });
    expect(scanned.body.data.totalUSD).toBeCloseTo(2000 / 139, 1);

    const missingSettlement = await request(app).post(`/api/buffet/sales/${saleId}/complete`).set('Authorization', `Bearer ${cashierToken}`).send({}).expect(400);
    expect(missingSettlement.body.error.code).toBe('SETTLEMENT_REQUIRED');
    expect(missingSettlement.body.error.message).toContain('طريقة الدفع');

    const completed = await request(app).post(`/api/buffet/sales/${saleId}/complete`).set('Authorization', `Bearer ${cashierToken}`)
      .send({ settlement: 'DEBT' }).expect(200);
    expect(completed.body.data).toMatchObject({ status: 'INVOICED', settlement: 'DEBT' });
    expect(completed.body.data.invoice).toMatchObject({ status: 'ISSUED', totalSYP: 2000 });

    const debts = await request(app).get('/api/buffet/debts').set('Authorization', `Bearer ${cashierToken}`).expect(200);
    const mine = debts.body.data.find((group: any) => group.employee.id === employeeId);
    expect(mine).toMatchObject({ remainingSYP: 2000 });
    const invoiceId = mine.invoices[0].id;

    const paid = await request(app).post(`/api/buffet/debts/${invoiceId}/pay`).set('Authorization', `Bearer ${cashierToken}`)
      .send({ currency: 'SYP', amount: 2000, method: 'CASH' }).expect(200);
    expect(paid.body.data).toMatchObject({ status: 'PAID', remainingSYP: 0 });

    const after = await request(app).get('/api/buffet/debts').set('Authorization', `Bearer ${cashierToken}`).expect(200);
    expect(after.body.data.find((group: any) => group.employee.id === employeeId)).toBeUndefined();
  });
});
