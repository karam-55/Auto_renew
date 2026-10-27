import { BookingStatus, BuffetBuyerType, BuffetSaleStatus, BuffetSettlement, InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { InvoiceService } from '../invoices/service';
import { PaymentService } from '../payments/service';
import { ensureDefaultAccounts } from '../accounting/automatic-journal-entries';
import settingsService from '../../services/settings.service';
import { buffetLinePrices } from './booking-lines';

type Tx = Prisma.TransactionClient;

export class BuffetError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

const RESERVING_SALE = (tenantId: string): Prisma.BuffetSaleWhereInput => ({
  tenantId,
  OR: [
    { status: { in: ['OPEN', 'ATTACHED_TO_BOOKING'] } },
    { status: 'COMPLETING', OR: [{ invoiceId: null }, { invoice: { status: 'DRAFT' } }] },
  ],
});
const SETTLEMENTS: BuffetSettlement[] = ['CASH', 'BANK', 'DEBT'];
const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'WAITING_PARTS', 'READY'];
const DEBT_INVOICE_STATUSES: InvoiceStatus[] = ['ISSUED', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'];

const SALE_INCLUDE = {
  lines: {
    include: { part: { select: { name: true, nameAr: true, barcode: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  employee: { select: { id: true, fullNameAr: true, employeeCode: true } },
  booking: {
    select: {
      id: true,
      customer: { select: { fullName: true, phone: true } },
      vehicle: { select: { make: true, model: true, licensePlate: true } },
    },
  },
  invoice: {
    select: { id: true, invoiceNumber: true, status: true, totalSYP: true, totalUSD: true, paidSYP: true, paidUSD: true },
  },
};

type SaleRecord = Prisma.BuffetSaleGetPayload<{ include: typeof SALE_INCLUDE }>;

function toSaleDto(sale: SaleRecord, rate: number) {
  const lines = sale.lines.map((line) => {
    const quantity = Number(line.quantity);
    const { priceSYP, priceUSD } = buffetLinePrices(line, rate);
    return {
      id: line.id,
      partId: line.partId,
      name: line.part.nameAr || line.part.name,
      barcode: line.part.barcode,
      quantity,
      priceSYP,
      priceUSD,
      totalSYP: priceSYP * quantity,
      totalUSD: priceUSD * quantity,
    };
  });
  const totalSYP = lines.reduce((sum, line) => sum + line.totalSYP, 0);
  const totalUSD = lines.reduce((sum, line) => sum + line.totalUSD, 0);
  return {
    id: sale.id,
    status: sale.status,
    buyerType: sale.buyerType,
    settlement: sale.settlement,
    notes: sale.notes,
    createdAt: sale.createdAt,
    completedAt: sale.completedAt,
    editable: sale.invoiceId == null && (sale.status === 'OPEN' || sale.status === 'ATTACHED_TO_BOOKING'),
    employee: sale.employee
      ? { id: sale.employee.id, name: sale.employee.fullNameAr, code: sale.employee.employeeCode }
      : null,
    booking: sale.booking
      ? {
          id: sale.booking.id,
          customerName: sale.booking.customer.fullName,
          customerPhone: sale.booking.customer.phone,
          vehicle: [sale.booking.vehicle.make, sale.booking.vehicle.model].filter(Boolean).join(' '),
          plate: sale.booking.vehicle.licensePlate,
        }
      : null,
    invoice: sale.invoice
      ? {
          id: sale.invoice.id,
          invoiceNumber: sale.invoice.invoiceNumber,
          status: sale.invoice.status,
          totalSYP: Number(sale.invoice.totalSYP),
          totalUSD: sale.invoice.totalUSD == null ? null : Number(sale.invoice.totalUSD),
          paidSYP: Number(sale.invoice.paidSYP),
          paidUSD: Number(sale.invoice.paidUSD),
        }
      : null,
    lines,
    totalSYP,
    totalUSD,
  };
}

async function lockPart(tx: Tx, partId: string) {
  await tx.$queryRaw`SELECT id FROM "Part" WHERE id = ${partId} FOR UPDATE`;
}

async function reservedQuantity(db: Tx | typeof prisma, tenantId: string, partId: string, excludeLineId?: string) {
  const aggregate = await db.buffetSaleLine.aggregate({
    where: {
      partId,
      id: excludeLineId ? { not: excludeLineId } : undefined,
      sale: RESERVING_SALE(tenantId),
    },
    _sum: { quantity: true },
  });
  return Number(aggregate._sum.quantity ?? 0);
}

async function loadEditableSale(tx: Tx, tenantId: string, saleId: string) {
  const sale = await tx.buffetSale.findFirst({ where: { id: saleId, tenantId }, include: { lines: true } });
  if (!sale) throw new BuffetError('SALE_NOT_FOUND', 'الفاتورة غير موجودة', 404);
  const editable = sale.invoiceId == null && (sale.status === 'OPEN' || sale.status === 'ATTACHED_TO_BOOKING');
  if (!editable) throw new BuffetError('SALE_LOCKED', 'لا يمكن تعديل الفاتورة بعد بدء إتمامها أو إصدارها', 409);
  return sale;
}

async function assertBookingOpen(db: Tx | typeof prisma, tenantId: string, bookingId: string) {
  const booking = await db.booking.findFirst({
    where: {
      id: bookingId,
      tenantId,
      deletedAt: null,
      status: { in: ACTIVE_BOOKING_STATUSES },
      AND: [{ OR: [{ workOrder: null }, { workOrder: { status: { not: 'COMPLETED' } } }] }],
      invoices: { none: { status: { notIn: ['DRAFT', 'CANCELLED'] }, deletedAt: null } },
    },
    select: { id: true },
  });
  if (!booking) throw new BuffetError('BOOKING_NOT_OPEN', 'الحجز غير نشط أو صدرت فاتورته بالفعل', 409);
}

function searchWhere(search?: string): Prisma.PartWhereInput {
  if (!search) return {};
  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { nameAr: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search } },
      { partNumber: { contains: search } },
    ],
  };
}

export class BuffetService {
  private invoices = new InvoiceService();
  private payments = new PaymentService();

  private async rate(tenantId: string) {
    return Number((await settingsService.getSettings(tenantId)).exchangeRate) || 0;
  }

  private async withAvailability<T extends { id: string; quantity: Prisma.Decimal; sellingPriceSYP: Prisma.Decimal; sellingPriceUSD: Prisma.Decimal | null; name: string; nameAr: string | null; barcode: string | null; baseUnitName: string | null; isBuffetItem: boolean }>(tenantId: string, parts: T[]) {
    const ids = parts.map((part) => part.id);
    const reserved = ids.length
      ? await prisma.buffetSaleLine.groupBy({
          by: ['partId'],
          where: { partId: { in: ids }, sale: RESERVING_SALE(tenantId) },
          _sum: { quantity: true },
        })
      : [];
    const reservedByPart = new Map(reserved.map((row) => [row.partId, Number(row._sum.quantity ?? 0)]));
    const rate = await this.rate(tenantId);
    return parts.map((part) => {
      const held = reservedByPart.get(part.id) ?? 0;
      const quantity = Number(part.quantity);
      const prices = buffetLinePrices({ priceSYP: part.sellingPriceSYP, priceUSD: part.sellingPriceUSD }, rate);
      return {
        id: part.id,
        name: part.nameAr || part.name,
        barcode: part.barcode,
        isBuffetItem: part.isBuffetItem,
        unit: part.baseUnitName ?? '',
        sellingPriceSYP: prices.priceSYP,
        sellingPriceUSD: prices.priceUSD,
        quantity,
        reserved: held,
        available: Math.max(0, quantity - held),
      };
    });
  }

  async listItems(tenantId: string, search?: string, limit = 200) {
    const parts = await prisma.part.findMany({
      where: { tenantId, isBuffetItem: true, isActive: true, deletedAt: null, ...searchWhere(search) },
      orderBy: { name: 'asc' },
      take: limit,
    });
    return this.withAvailability(tenantId, parts);
  }

  async listCatalog(tenantId: string, search?: string, limit = 60) {
    const parts = await prisma.part.findMany({
      where: { tenantId, isActive: true, deletedAt: null, ...searchWhere(search) },
      orderBy: [{ isBuffetItem: 'desc' }, { name: 'asc' }],
      take: limit,
    });
    return this.withAvailability(tenantId, parts);
  }

  async getItemByBarcode(tenantId: string, rawCode: string) {
    const code = rawCode.trim();
    const part = code
      ? await prisma.part.findFirst({ where: { tenantId, barcode: code, isBuffetItem: true, isActive: true, deletedAt: null } })
      : null;
    if (!part) throw new BuffetError('ITEM_NOT_FOUND', 'هذا الباركود غير مرتبط بمادة بوفيه نشطة', 404);
    const [item] = await this.withAvailability(tenantId, [part]);
    return item;
  }

  async updateItem(tenantId: string, partId: string, input: { barcode?: string | null; isBuffetItem?: boolean }) {
    const part = await prisma.part.findFirst({ where: { id: partId, tenantId, deletedAt: null } });
    if (!part) throw new BuffetError('ITEM_NOT_FOUND', 'المادة غير موجودة', 404);
    const data: Prisma.PartUpdateInput = {};
    if (input.barcode !== undefined) {
      const normalized = input.barcode == null ? '' : String(input.barcode).trim();
      if (normalized.length > 64) throw new BuffetError('BARCODE_TOO_LONG', 'الباركود طويل جداً', 400);
      if (normalized) {
        const taken = await prisma.part.findFirst({ where: { tenantId, barcode: normalized, NOT: { id: partId } }, select: { id: true } });
        if (taken) throw new BuffetError('BARCODE_TAKEN', 'هذا الباركود مستخدم لمادة أخرى', 409);
        data.barcode = normalized;
      } else {
        data.barcode = null;
      }
    }
    if (input.isBuffetItem !== undefined) data.isBuffetItem = Boolean(input.isBuffetItem);
    const updated = await prisma.part.update({ where: { id: partId }, data });
    const [item] = await this.withAvailability(tenantId, [updated]);
    return item;
  }

  async listSales(tenantId: string, limit = 50) {
    const sales = await prisma.buffetSale.findMany({
      where: { tenantId },
      include: SALE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const rate = await this.rate(tenantId);
    return sales.map((sale) => toSaleDto(sale, rate));
  }

  async getSale(tenantId: string, saleId: string) {
    const sale = await prisma.buffetSale.findFirst({ where: { id: saleId, tenantId }, include: SALE_INCLUDE });
    if (!sale) throw new BuffetError('SALE_NOT_FOUND', 'الفاتورة غير موجودة', 404);
    return toSaleDto(sale, await this.rate(tenantId));
  }

  async createSale(tenantId: string, sellerId: string, input: { buyerType: string; employeeId?: string; bookingId?: string; notes?: string }) {
    const notes = input.notes?.trim() || null;
    if (input.buyerType === 'EMPLOYEE') {
      if (!input.employeeId) throw new BuffetError('EMPLOYEE_REQUIRED', 'اختر الموظف', 400);
      const employee = await prisma.employee.findFirst({
        where: { id: input.employeeId, tenantId, deletedAt: null, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!employee) throw new BuffetError('EMPLOYEE_NOT_FOUND', 'الموظف غير موجود أو غير فعّال', 404);
      const sale = await prisma.buffetSale.create({
        data: { tenantId, sellerId, buyerType: 'EMPLOYEE' as BuffetBuyerType, employeeId: employee.id, notes },
      });
      return this.getSale(tenantId, sale.id);
    }
    if (input.buyerType === 'CUSTOMER') {
      if (!input.bookingId) throw new BuffetError('BOOKING_REQUIRED', 'اختر الحجز', 400);
      await assertBookingOpen(prisma, tenantId, input.bookingId);
      const sale = await prisma.buffetSale.create({
        data: { tenantId, sellerId, buyerType: 'CUSTOMER' as BuffetBuyerType, bookingId: input.bookingId, notes },
      });
      return this.getSale(tenantId, sale.id);
    }
    throw new BuffetError('INVALID_BUYER', 'نوع المشتري غير صحيح', 400);
  }

  async listEmployees(tenantId: string, search?: string) {
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: 'ACTIVE',
        ...(search ? { OR: [{ fullNameAr: { contains: search } }, { employeeCode: { contains: search } }] } : {}),
      },
      select: { id: true, fullNameAr: true, employeeCode: true, position: true },
      orderBy: { fullNameAr: 'asc' },
      take: 100,
    });
    return employees.map((employee) => ({
      id: employee.id,
      name: employee.fullNameAr,
      code: employee.employeeCode,
      position: employee.position,
    }));
  }

  async listActiveBookings(tenantId: string, search?: string) {
    const bookings = await prisma.booking.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ACTIVE_BOOKING_STATUSES },
        AND: [{ OR: [{ workOrder: null }, { workOrder: { status: { not: 'COMPLETED' } } }] }],
        invoices: { none: { status: { notIn: ['DRAFT', 'CANCELLED'] }, deletedAt: null } },
        ...(search
          ? {
              OR: [
                { customer: { fullName: { contains: search, mode: 'insensitive' } } },
                { customer: { phone: { contains: search } } },
                { vehicle: { licensePlate: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        vehicle: { select: { make: true, model: true, licensePlate: true } },
      },
      orderBy: { scheduledDate: 'desc' },
      take: 60,
    });
    return bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      customerName: booking.customer.fullName,
      customerPhone: booking.customer.phone,
      vehicle: [booking.vehicle.make, booking.vehicle.model].filter(Boolean).join(' '),
      plate: booking.vehicle.licensePlate,
      scheduledDate: booking.scheduledDate,
    }));
  }

  async addLine(tenantId: string, saleId: string, rawCode: string) {
    const code = (rawCode || '').trim();
    if (!code) throw new BuffetError('BARCODE_REQUIRED', 'أدخل الباركود', 400);
    await prisma.$transaction(async (tx) => {
      const part = await tx.part.findFirst({ where: { tenantId, barcode: code, isBuffetItem: true, isActive: true, deletedAt: null } });
      if (!part) throw new BuffetError('ITEM_NOT_FOUND', 'هذا الباركود غير مرتبط بمادة بوفيه نشطة', 404);
      if (Number(part.sellingPriceSYP) <= 0 && Number(part.sellingPriceUSD ?? 0) <= 0) {
        throw new BuffetError('ITEM_NOT_PRICED', 'سعر البيع غير محدد لهذه المادة', 409);
      }
      await lockPart(tx, part.id);
      const sale = await loadEditableSale(tx, tenantId, saleId);
      const line = sale.lines.find((existing) => existing.partId === part.id);
      const heldByOthers = await reservedQuantity(tx, tenantId, part.id, line?.id);
      const nextQuantity = Number(line?.quantity ?? 0) + 1;
      const available = Number(part.quantity) - heldByOthers;
      if (nextQuantity > available) {
        throw new BuffetError('INSUFFICIENT_STOCK', `المتوفر من ${part.nameAr || part.name}: ${Math.max(0, Math.floor(available))}`, 409);
      }
      if (line) {
        await tx.buffetSaleLine.update({ where: { id: line.id }, data: { quantity: nextQuantity } });
      } else {
        await tx.buffetSaleLine.create({
          data: {
            saleId,
            partId: part.id,
            quantity: 1,
            priceSYP: part.sellingPriceSYP,
            priceUSD: part.sellingPriceUSD,
          },
        });
      }
    });
    return this.getSale(tenantId, saleId);
  }

  async setLineQuantity(tenantId: string, saleId: string, lineId: string, quantity: unknown) {
    const next = Number(quantity);
    if (!Number.isInteger(next) || next < 1) throw new BuffetError('INVALID_QUANTITY', 'الكمية يجب أن تكون عدداً صحيحاً أكبر من صفر', 400);
    await prisma.$transaction(async (tx) => {
      const sale = await loadEditableSale(tx, tenantId, saleId);
      const line = sale.lines.find((existing) => existing.id === lineId);
      if (!line) throw new BuffetError('LINE_NOT_FOUND', 'البند غير موجود', 404);
      await lockPart(tx, line.partId);
      const part = await tx.part.findFirst({ where: { id: line.partId, tenantId } });
      if (!part) throw new BuffetError('ITEM_NOT_FOUND', 'المادة غير موجودة', 404);
      const heldByOthers = await reservedQuantity(tx, tenantId, line.partId, line.id);
      const available = Number(part.quantity) - heldByOthers;
      if (next > available) {
        throw new BuffetError('INSUFFICIENT_STOCK', `المتوفر من ${part.nameAr || part.name}: ${Math.max(0, Math.floor(available))}`, 409);
      }
      await tx.buffetSaleLine.update({ where: { id: line.id }, data: { quantity: next } });
    });
    return this.getSale(tenantId, saleId);
  }

  async removeLine(tenantId: string, saleId: string, lineId: string) {
    await prisma.$transaction(async (tx) => {
      const sale = await loadEditableSale(tx, tenantId, saleId);
      const line = sale.lines.find((existing) => existing.id === lineId);
      if (!line) throw new BuffetError('LINE_NOT_FOUND', 'البند غير موجود', 404);
      await tx.buffetSaleLine.delete({ where: { id: line.id } });
    });
    return this.getSale(tenantId, saleId);
  }

  async cancelSale(tenantId: string, saleId: string) {
    const result = await prisma.buffetSale.updateMany({
      where: { id: saleId, tenantId, status: { in: ['OPEN', 'ATTACHED_TO_BOOKING'] }, invoiceId: null },
      data: { status: 'CANCELLED' },
    });
    if (result.count !== 1) throw new BuffetError('SALE_NOT_CANCELLABLE', 'لا يمكن إلغاء هذه الفاتورة بعد بدء إتمامها', 409);
    return this.getSale(tenantId, saleId);
  }

  async complete(tenantId: string, userId: string, saleId: string, settlementInput?: string) {
    const sale = await prisma.buffetSale.findFirst({ where: { id: saleId, tenantId }, select: { id: true, buyerType: true } });
    if (!sale) throw new BuffetError('SALE_NOT_FOUND', 'الفاتورة غير موجودة', 404);
    if (sale.buyerType === 'CUSTOMER') return this.attachToBooking(tenantId, saleId);
    return this.completeEmployeeSale(tenantId, userId, saleId, settlementInput);
  }

  private async attachToBooking(tenantId: string, saleId: string) {
    const sale = await prisma.buffetSale.findFirst({ where: { id: saleId, tenantId }, include: { lines: true } });
    if (!sale) throw new BuffetError('SALE_NOT_FOUND', 'الفاتورة غير موجودة', 404);
    if (sale.status !== 'OPEN') throw new BuffetError('SALE_NOT_OPEN', 'هذه الفاتورة مكتملة بالفعل', 409);
    if (sale.lines.length === 0) throw new BuffetError('SALE_EMPTY', 'أضف مواد قبل الإتمام', 400);
    if (!sale.bookingId) throw new BuffetError('BOOKING_REQUIRED', 'اختر الحجز', 400);
    await assertBookingOpen(prisma, tenantId, sale.bookingId);
    const claimed = await prisma.buffetSale.updateMany({
      where: { id: saleId, tenantId, status: 'OPEN' },
      data: { status: 'ATTACHED_TO_BOOKING', completedAt: new Date() },
    });
    if (claimed.count !== 1) throw new BuffetError('SALE_NOT_OPEN', 'هذه الفاتورة مكتملة بالفعل', 409);
    return this.getSale(tenantId, saleId);
  }

  private async completeEmployeeSale(tenantId: string, userId: string, saleId: string, settlementInput?: string) {
    const requested = settlementInput ? (String(settlementInput).toUpperCase() as BuffetSettlement) : undefined;
    if (requested && !SETTLEMENTS.includes(requested)) throw new BuffetError('INVALID_SETTLEMENT', 'طريقة التسوية غير صحيحة', 400);

    const current = await prisma.buffetSale.findFirst({
      where: { id: saleId, tenantId },
      include: { lines: { include: { part: true } } },
    });
    if (!current) throw new BuffetError('SALE_NOT_FOUND', 'الفاتورة غير موجودة', 404);
    if (current.status === 'OPEN') {
      if (current.lines.length === 0) throw new BuffetError('SALE_EMPTY', 'أضف مواد قبل الإتمام', 400);
      if (!requested) throw new BuffetError('SETTLEMENT_REQUIRED', 'اختر طريقة الدفع: نقداً أو بنك أو آجل', 400);
      const claimed = await prisma.buffetSale.updateMany({
        where: { id: saleId, tenantId, status: 'OPEN' },
        data: { status: 'COMPLETING', settlement: requested },
      });
      if (claimed.count !== 1) throw new BuffetError('SALE_NOT_OPEN', 'هذه الفاتورة مكتملة بالفعل', 409);
    } else if (current.status === 'COMPLETING') {
      if (requested && current.settlement && requested !== current.settlement) {
        throw new BuffetError('SETTLEMENT_MISMATCH', 'طريقة الدفع لا تطابق المحاولة السابقة', 409);
      }
    } else {
      throw new BuffetError('SALE_NOT_OPEN', 'هذه الفاتورة مكتملة بالفعل', 409);
    }

    const claimedSale = await prisma.buffetSale.findFirstOrThrow({
      where: { id: saleId, tenantId },
      include: { lines: { include: { part: true } } },
    });
    const settlement = claimedSale.settlement as BuffetSettlement;

    try {
      await ensureDefaultAccounts(tenantId);
      let invoiceId = claimedSale.invoiceId;
      if (!invoiceId) {
        if (claimedSale.lines.some((line) => Number(line.priceSYP) <= 0 && Number(line.priceUSD ?? 0) <= 0)) {
          throw new BuffetError('ITEM_NOT_PRICED', 'بعض المواد بلا سعر بيع، راجع المخزون', 409);
        }
        const rate = await settingsService.getRequiredExchangeRate(tenantId);
        const invoice = await this.invoices.createInvoice(tenantId, userId, {
          employeeId: claimedSale.employeeId ?? undefined,
          invoiceDate: new Date(),
          notes: `فاتورة بوفيه ${claimedSale.id.slice(0, 8)}`,
          items: claimedSale.lines.map((line) => {
            const prices = buffetLinePrices(line, rate);
            return {
              partId: line.partId,
              description: line.part.nameAr || line.part.name,
              quantity: Number(line.quantity),
              priceSYP: prices.priceSYP,
              priceUSD: prices.priceUSD,
            };
          }),
        } as any);
        invoiceId = invoice.id;
        await prisma.buffetSale.update({ where: { id: saleId }, data: { invoiceId } });
      }

      let invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
      if (!invoice) throw new BuffetError('INVOICE_NOT_FOUND', 'فاتورة البيع غير موجودة', 404);
      if (invoice.status === 'DRAFT') {
        await this.invoices.finalizeInvoice(tenantId, invoiceId, userId);
        invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
      }

      if (settlement !== 'DEBT') {
        const existingPayments = await prisma.payment.count({ where: { tenantId, invoiceId, deletedAt: null } });
        if (existingPayments === 0 && invoice) {
          await this.payments.createPayment(tenantId, userId, {
            invoiceId,
            amountSYP: Number(invoice.totalSYP),
            amountUSD: invoice.totalUSD != null && Number(invoice.totalUSD) > 0 ? Number(invoice.totalUSD) : undefined,
            paymentMethod: settlement === 'CASH' ? PaymentMethod.CASH : PaymentMethod.BANK_TRANSFER,
            paymentDate: new Date(),
            notes: 'بيع بوفيه',
          }, { exactAmounts: true });
        }
      }

      await prisma.buffetSale.update({
        where: { id: saleId },
        data: { status: 'INVOICED', completedAt: new Date() },
      });
    } catch (error) {
      await this.revertFailedCompletion(tenantId, saleId);
      throw error;
    }
    return this.getSale(tenantId, saleId);
  }

  private async revertFailedCompletion(tenantId: string, saleId: string) {
    const latest = await prisma.buffetSale.findFirst({ where: { id: saleId, tenantId }, select: { invoiceId: true, status: true } });
    if (!latest || latest.status !== 'COMPLETING') return;
    if (!latest.invoiceId) {
      await prisma.buffetSale.updateMany({
        where: { id: saleId, tenantId, status: 'COMPLETING' },
        data: { status: 'OPEN', settlement: null },
      });
      return;
    }
    const draft = await prisma.invoice.findFirst({ where: { id: latest.invoiceId, tenantId, status: 'DRAFT' }, select: { id: true } });
    if (draft) {
      await this.invoices.deleteInvoice(tenantId, draft.id);
      await prisma.buffetSale.updateMany({
        where: { id: saleId, tenantId, status: 'COMPLETING' },
        data: { status: 'OPEN', settlement: null, invoiceId: null },
      });
    }
  }

  async listDebts(tenantId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, employeeId: { not: null }, status: { in: DEBT_INVOICE_STATUSES }, deletedAt: null },
      include: {
        employee: { select: { id: true, fullNameAr: true, employeeCode: true } },
        items: { select: { description: true, quantity: true, totalSYP: true } },
      },
      orderBy: { invoiceDate: 'asc' },
    });
    const byEmployee = new Map<string, {
      employee: { id: string; name: string; code: string };
      remainingSYP: number;
      remainingUSD: number;
      invoices: unknown[];
    }>();
    for (const invoice of invoices) {
      const remainingSYP = Number(invoice.totalSYP) - Number(invoice.paidSYP);
      if (remainingSYP <= 0.01 || !invoice.employee) continue;
      const remainingUSD = invoice.totalUSD == null ? 0 : Number(invoice.totalUSD) - Number(invoice.paidUSD);
      const group = byEmployee.get(invoice.employee.id) ?? {
        employee: { id: invoice.employee.id, name: invoice.employee.fullNameAr, code: invoice.employee.employeeCode },
        remainingSYP: 0,
        remainingUSD: 0,
        invoices: [],
      };
      group.remainingSYP += remainingSYP;
      group.remainingUSD += remainingUSD;
      group.invoices.push({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        status: invoice.status,
        items: invoice.items.map((item) => ({ description: item.description, quantity: Number(item.quantity), totalSYP: Number(item.totalSYP) })),
        totalSYP: Number(invoice.totalSYP),
        paidSYP: Number(invoice.paidSYP),
        remainingSYP,
        totalUSD: invoice.totalUSD == null ? null : Number(invoice.totalUSD),
        remainingUSD,
      });
      byEmployee.set(invoice.employee.id, group);
    }
    return Array.from(byEmployee.values()).sort((a, b) => b.remainingSYP - a.remainingSYP);
  }

  async payDebt(tenantId: string, userId: string, invoiceId: string, input: { currency: string; amount: unknown; method: string }) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, employeeId: { not: null }, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!invoice) throw new BuffetError('DEBT_NOT_FOUND', 'الدين غير موجود', 404);
    if (!DEBT_INVOICE_STATUSES.includes(invoice.status)) throw new BuffetError('DEBT_NOT_OPEN', 'هذا الدين مسدد أو غير قابل للتسديد', 409);
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BuffetError('INVALID_AMOUNT', 'أدخل مبلغاً صحيحاً', 400);
    const currency = String(input.currency || 'SYP').toUpperCase();
    const method = String(input.method || 'CASH').toUpperCase();
    const paymentMethod = method === 'BANK' ? PaymentMethod.BANK_TRANSFER : PaymentMethod.CASH;
    const current = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      select: { totalSYP: true, paidSYP: true, totalUSD: true, paidUSD: true },
    });
    if (!current) throw new BuffetError('DEBT_NOT_FOUND', 'الدين غير موجود', 404);
    const hasUSD = current.totalUSD != null && Number(current.totalUSD) > 0;
    const remainingSYP = Number(current.totalSYP) - Number(current.paidSYP);
    const remainingUSD = hasUSD ? Number(current.totalUSD) - Number(current.paidUSD) : 0;
    if (currency === 'USD' && !hasUSD) throw new BuffetError('INVALID_CURRENCY', 'هذا الدين لا يُسدَّد بالدولار', 400);
    if ((hasUSD && remainingUSD <= 0.005) || remainingSYP <= 0.005) throw new BuffetError('DEBT_NOT_OPEN', 'هذا الدين مسدد بالكامل', 409);
    const rate = await settingsService.getRequiredExchangeRate(tenantId);
    const round2 = (value: number) => Math.round(value * 100) / 100;
    const paidSYP = currency === 'USD' ? Math.round(amount * rate) : amount;
    const paidUSD = currency === 'USD' ? amount : round2(amount / rate);
    const closesDebt = paidSYP >= remainingSYP - 1 || (hasUSD && paidUSD >= remainingUSD - 0.005);
    const amounts = closesDebt
      ? { amountSYP: round2(remainingSYP), amountUSD: hasUSD ? round2(remainingUSD) : undefined }
      : currency === 'USD' ? { amountUSD: round2(amount) } : { amountSYP: round2(amount) };
    await this.payments.createPayment(tenantId, userId, {
      invoiceId,
      ...amounts,
      paymentMethod,
      paymentDate: new Date(),
      notes: 'تسديد دين موظف بوفيه',
    }, { exactAmounts: closesDebt });
    const updated = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId }, select: { id: true, status: true, totalSYP: true, paidSYP: true, totalUSD: true, paidUSD: true } });
    return updated && {
      id: updated.id,
      status: updated.status,
      remainingSYP: Number(updated.totalSYP) - Number(updated.paidSYP),
      remainingUSD: updated.totalUSD == null ? null : Number(updated.totalUSD) - Number(updated.paidUSD),
    };
  }
}
