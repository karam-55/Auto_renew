import { randomUUID } from 'crypto';
import prisma from '../../src/config/database';
import { BuffetService } from '../../src/modules/buffet/service';
import { InvoiceService } from '../../src/modules/invoices/service';
import { ensureDefaultAccounts } from '../../src/modules/accounting/automatic-journal-entries';

const testDatabaseUrl = process.env.TEST_DATABASE_URL || '';
const runDatabaseIntegrationTests = process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true' && testDatabaseUrl.includes('127.0.0.1:55432/buffet_');
const integrationDescribe = runDatabaseIntegrationTests ? describe : describe.skip;

integrationDescribe('Buffet POS on a real database', () => {
  const buffet = new BuffetService();
  const invoiceService = new InvoiceService();
  let userId = '';
  const part: Record<string, { id: string }> = {};
  let tenantId = '';
  let employeeId = '';
  let bookingId = '';
  const lineIdOf = (sale: any, barcode: string) => sale.lines.find((line: any) => line.barcode === barcode).id;

  beforeAll(async () => {
    tenantId = (await prisma.tenant.create({ data: { name: `buffet-${randomUUID().slice(0, 8)}` } })).id;
    userId = (await prisma.user.create({
      data: { tenantId, fullName: 'كاشير اختبار', username: `cashier-${randomUUID().slice(0, 6)}`, passwordHash: 'not-used', phone: '0900000001', role: 'CASHIER' },
    })).id;
    await prisma.companySettings.create({ data: { tenantId, companyName: 'Buffet Test', exchangeRate: 139, taxRate: 0 } });
    await prisma.fiscalPeriod.create({ data: { tenantId, name: 'FY test', startDate: new Date('2025-01-01'), endDate: new Date('2030-12-31') } });
    await ensureDefaultAccounts(tenantId);
    const department = await prisma.department.create({ data: { tenantId, nameAr: 'البوفيه' } });
    employeeId = (await prisma.employee.create({
      data: {
        tenantId, departmentId: department.id, phone: '0900000000', position: 'موظف', hireDate: new Date('2025-01-01'),
        salarySYP: 0, contractType: 'FULL_TIME', employeeCode: 'EMP-1', fullNameAr: 'موظف اختبار',
      },
    })).id;
    const makePart = async (key: string, barcode: string, quantity: number, priceSYP: number, priceUSD: number | null = null, isBuffetItem = true) => {
      const created = await prisma.part.create({
        data: { tenantId, partNumber: `PN-${key}`, name: key, nameAr: key, costSYP: 500, sellingPriceSYP: priceSYP, sellingPriceUSD: priceUSD, quantity, barcode, isBuffetItem },
      });
      part[key] = { id: created.id };
    };
    await makePart('coffee', 'C-1', 5, 2000);
    await makePart('juice', 'J-1', 1, 3000);
    await makePart('biscuit', 'B-1', 10, 2780, 20);
    await makePart('tea', 'T-1', 3, 1500);
    await makePart('other', 'N-1', 2, 1000, null, false);
    await makePart('usdonly', 'U-1', 5, 0, 10);
    const customer = await prisma.customer.create({ data: { tenantId, fullName: 'زبون اختبار', phone: '0911111111' } });
    const vehicle = await prisma.vehicle.create({
      data: { tenantId, customerId: customer.id, make: 'Toyota', model: 'Corolla', year: 2015, licensePlate: `D-${randomUUID().slice(0, 6)}`, publicCarId: randomUUID() },
    });
    const service = await prisma.service.create({ data: { tenantId, name: 'غسيل', priceSYP: 20000, serviceType: 'FIXED' } });
    const booking = await prisma.booking.create({
      data: { tenantId, customerId: customer.id, vehicleId: vehicle.id, scheduledDate: new Date(), publicToken: randomUUID() },
    });
    bookingId = booking.id;
    await prisma.bookingService.create({ data: { bookingId, serviceId: service.id, priceSYP: 20000, priceFinalized: true, quantity: 1 } });
  });

  it('reserves stock per open sale and rejects overselling', async () => {
    const first = await buffet.createSale(tenantId, userId, { buyerType: 'EMPLOYEE', employeeId });
    const withJuice = await buffet.addLine(tenantId, first.id, 'J-1');
    expect(withJuice.lines[0].quantity).toBe(1);
    const second = await buffet.createSale(tenantId, userId, { buyerType: 'EMPLOYEE', employeeId });
    await expect(buffet.addLine(tenantId, second.id, 'J-1')).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    await buffet.cancelSale(tenantId, first.id);
    const third = await buffet.createSale(tenantId, userId, { buyerType: 'EMPLOYEE', employeeId });
    const afterRelease = await buffet.addLine(tenantId, third.id, 'J-1');
    expect(afterRelease.lines[0].quantity).toBe(1);
    await buffet.cancelSale(tenantId, third.id);
    await buffet.cancelSale(tenantId, second.id);
  });

  it('rejects non-buffet barcodes and duplicate barcodes', async () => {
    await expect(buffet.getItemByBarcode(tenantId, 'N-1')).rejects.toMatchObject({ code: 'ITEM_NOT_FOUND' });
    await expect(buffet.updateItem(tenantId, part.tea.id, { barcode: 'C-1' })).rejects.toMatchObject({ code: 'BARCODE_TAKEN' });
    const relinked = await buffet.updateItem(tenantId, part.other.id, { barcode: 'O-1', isBuffetItem: true });
    expect(relinked.barcode).toBe('O-1');
  });

  it('completes an employee cash sale, collects cash and posts to employee receivables', async () => {
    const sale = await buffet.createSale(tenantId, userId, { buyerType: 'EMPLOYEE', employeeId });
    await buffet.addLine(tenantId, sale.id, 'B-1');
    await buffet.addLine(tenantId, sale.id, 'B-1');
    const edited = await buffet.setLineQuantity(tenantId, sale.id, lineIdOf(await buffet.getSale(tenantId, sale.id), 'B-1'), 3);
    expect(edited.totalSYP).toBe(2780 * 3);
    const done = await buffet.complete(tenantId, userId, sale.id, 'CASH');
    expect(done.status).toBe('INVOICED');
    expect(done.invoice).toMatchObject({ status: 'PAID' });
    expect(done.invoice!.paidUSD).toBeCloseTo(done.invoice!.totalUSD!, 2);
    const biscuit = await prisma.part.findUnique({ where: { id: part.biscuit.id } });
    expect(Number(biscuit!.quantity)).toBe(7);
    await expect(buffet.setLineQuantity(tenantId, sale.id, lineIdOf(done, 'B-1'), 1)).rejects.toMatchObject({ code: 'SALE_LOCKED' });
    await expect(buffet.complete(tenantId, userId, sale.id, 'CASH')).rejects.toMatchObject({ code: 'SALE_NOT_OPEN' });
    const receivable = await prisma.account.findFirst({ where: { tenantId, code: '1210' } });
    const sums = await prisma.journalLine.aggregate({ where: { accountId: receivable!.id }, _sum: { debitSYP: true, creditSYP: true } });
    const debit = Number(sums._sum.debitSYP);
    const credit = Number(sums._sum.creditSYP);
    expect(debit).toBeCloseTo(done.invoice!.totalSYP, 2);
    expect(Math.abs(debit - credit)).toBeLessThan(1);
  });

  it('keeps unpaid employee sales as debts until they are settled', async () => {
    const sale = await buffet.createSale(tenantId, userId, { buyerType: 'EMPLOYEE', employeeId });
    await buffet.addLine(tenantId, sale.id, 'T-1');
    await buffet.addLine(tenantId, sale.id, 'T-1');
    const done = await buffet.complete(tenantId, userId, sale.id, 'DEBT');
    expect(done.invoice!.status).toBe('ISSUED');
    const mine = (await buffet.listDebts(tenantId)).find((group) => group.employee.id === employeeId);
    expect(mine!.remainingSYP).toBeGreaterThanOrEqual(3000);
    const invoiceId = done.invoice!.id;
    const partial = await buffet.payDebt(tenantId, userId, invoiceId, { currency: 'SYP', amount: 1000, method: 'CASH' });
    expect(partial!.status).toBe('PARTIALLY_PAID');
    const settled = await buffet.payDebt(tenantId, userId, invoiceId, { currency: 'SYP', amount: 999999, method: 'BANK' });
    expect(settled!.status).toBe('PAID');
    expect((await buffet.listDebts(tenantId)).find((group) => group.employee.id === employeeId)).toBeUndefined();
  });

  it('attaches a customer sale to the booking and bills it with the work-order invoice', async () => {
    const sale = await buffet.createSale(tenantId, userId, { buyerType: 'CUSTOMER', bookingId });
    await buffet.addLine(tenantId, sale.id, 'C-1');
    await buffet.addLine(tenantId, sale.id, 'C-1');
    await buffet.addLine(tenantId, sale.id, 'U-1');
    const attached = await buffet.complete(tenantId, userId, sale.id);
    expect(attached.status).toBe('ATTACHED_TO_BOOKING');
    const invoice = await invoiceService.createAndFinalizeWorkOrderInvoice(tenantId, bookingId, userId);
    const after = await buffet.getSale(tenantId, sale.id);
    expect(after.status).toBe('INVOICED');
    expect(after.invoice?.id).toBe(invoice.id);
    const coffee = await prisma.part.findUnique({ where: { id: part.coffee.id } });
    expect(Number(coffee!.quantity)).toBe(3);
    const items = await prisma.invoiceItem.findMany({ where: { invoiceId: invoice.id, partId: part.coffee.id } });
    expect(items).toHaveLength(1);
    expect(Number(items[0].quantity)).toBe(2);
    const usdItem = await prisma.invoiceItem.findFirst({ where: { invoiceId: invoice.id, partId: part.usdonly.id } });
    expect(Number(usdItem!.priceSYP)).toBe(10 * 139);
    expect(Number(usdItem!.priceUSD)).toBe(10);
    expect(Number(usdItem!.totalSYP)).toBe(10 * 139);
    const usdOnly = await prisma.part.findUnique({ where: { id: part.usdonly.id } });
    expect(Number(usdOnly!.quantity)).toBe(4);
    await expect(buffet.createSale(tenantId, userId, { buyerType: 'CUSTOMER', bookingId })).rejects.toMatchObject({ code: 'BOOKING_NOT_OPEN' });
  });

  it('keeps both currencies exact when SYP and USD prices are not rate-aligned', async () => {
    await prisma.part.create({
      data: { tenantId, partNumber: 'PN-R', name: 'rounding', nameAr: 'تقريب', costSYP: 500, sellingPriceSYP: 2000, sellingPriceUSD: 14.39, quantity: 20, barcode: 'R-1', isBuffetItem: true },
    });
    const receivable = await prisma.account.findFirst({ where: { tenantId, code: '1210' } });
    const receivableNet = async () => {
      const sums = await prisma.journalLine.aggregate({ where: { accountId: receivable!.id }, _sum: { debitSYP: true, creditSYP: true } });
      return Number(sums._sum.debitSYP) - Number(sums._sum.creditSYP);
    };
    const netBefore = await receivableNet();
    const cash = await buffet.createSale(tenantId, userId, { buyerType: 'EMPLOYEE', employeeId });
    for (let i = 0; i < 3; i++) await buffet.addLine(tenantId, cash.id, 'R-1');
    const paidCash = await buffet.complete(tenantId, userId, cash.id, 'CASH');
    expect(paidCash.invoice).toMatchObject({ status: 'PAID', totalSYP: 6000, paidSYP: 6000 });
    expect(paidCash.invoice!.paidUSD).toBeCloseTo(paidCash.invoice!.totalUSD!, 2);
    const debt = await buffet.createSale(tenantId, userId, { buyerType: 'EMPLOYEE', employeeId });
    for (let i = 0; i < 3; i++) await buffet.addLine(tenantId, debt.id, 'R-1');
    const issued = await buffet.complete(tenantId, userId, debt.id, 'DEBT');
    const partial = await buffet.payDebt(tenantId, userId, issued.invoice!.id, { currency: 'SYP', amount: 1000, method: 'CASH' });
    expect(partial!.status).toBe('PARTIALLY_PAID');
    const settled = await buffet.payDebt(tenantId, userId, issued.invoice!.id, { currency: 'SYP', amount: 999999, method: 'CASH' });
    expect(settled).toMatchObject({ status: 'PAID', remainingSYP: 0 });
    expect(settled!.remainingUSD).toBeCloseTo(0, 2);
    const usdDebt = await buffet.createSale(tenantId, userId, { buyerType: 'EMPLOYEE', employeeId });
    await buffet.addLine(tenantId, usdDebt.id, 'R-1');
    const usdIssued = await buffet.complete(tenantId, userId, usdDebt.id, 'DEBT');
    const usdSettled = await buffet.payDebt(tenantId, userId, usdIssued.invoice!.id, { currency: 'USD', amount: 14.39, method: 'BANK' });
    expect(usdSettled).toMatchObject({ status: 'PAID', remainingSYP: 0 });
    expect(usdSettled!.remainingUSD).toBeCloseTo(0, 2);
    expect(Math.abs((await receivableNet()) - netBefore)).toBeLessThan(0.005);
  });
});
