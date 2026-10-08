import prisma from '../../config/database';
import settingsService from '../../services/settings.service';
import {
  GoodsReceiptNote,
  GRNLine,
  CreateGRNDto,
  UpdateGRNDto,
  CreateGRNLineDto,
  UpdateGRNLineDto,
  GRNFilters,
  PaginationParams,
  PaginatedResponse,
} from './types';
import { createGRNJournalEntry, ensureDefaultAccounts } from '../accounting/automatic-journal-entries';

export class GRNService {
  async createGRN(tenantId: string, data: CreateGRNDto, userId?: string): Promise<GoodsReceiptNote> {
    // Check if purchase order exists and belongs to tenant
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id: data.purchaseOrderId, tenantId },
      include: { items: { select: { partId: true, quantity: true, receivedQty: true } } },
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Use supplier from purchase order if not provided
    const supplierId = data.supplierId || purchaseOrder.supplierId;

    // Check if supplier exists and belongs to tenant
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, tenantId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Validate warehouse if provided
    if (data.warehouseId) {
      const warehouse = await prisma.warehouse.findFirst({
        where: { id: data.warehouseId, tenantId },
      });
      if (!warehouse) {
        throw new Error('Warehouse not found');
      }
    }

    // Validate lines
    if (!data.lines || data.lines.length === 0) {
      throw new Error('GRN must have at least one line');
    }

    // Validate lines quantities and costs
    for (const line of data.lines) {
      const damagedQuantity = line.damagedQuantity ?? 0;
      if (!Number.isInteger(line.orderedQuantity) || line.orderedQuantity < 0 ||
          !Number.isInteger(line.receivedQuantity) || line.receivedQuantity < 0 ||
          !Number.isInteger(damagedQuantity) || damagedQuantity < 0 || damagedQuantity > line.receivedQuantity) {
        throw new Error('GRN quantities must be non-negative whole numbers and damaged quantity cannot exceed received quantity');
      }
      if (line.receivedQuantity > line.orderedQuantity) throw new Error('Received quantity cannot exceed ordered quantity');
      const purchaseOrderLine = purchaseOrder.items.find((item) => item.partId === line.partId);
      if (!purchaseOrderLine) throw new Error(`Part ${line.partId} is not included in the purchase order`);
      if (line.orderedQuantity > purchaseOrderLine.quantity - purchaseOrderLine.receivedQty) {
        throw new Error(`GRN quantity exceeds the outstanding order quantity for part ${line.partId}`);
      }
      if (line.unitCost != null && line.unitCost < 0 || line.unitCostUSD != null && line.unitCostUSD < 0) {
        throw new Error('Unit cost cannot be negative');
      }
      if (line.unitCost == null && line.unitCostUSD == null) throw new Error('Unit cost is required in USD or SYP');

      // Validate parts in lines
      const part = await prisma.part.findFirst({ where: { id: line.partId, tenantId } });
      if (!part) throw new Error(`Part with ID ${line.partId} not found`);
    }
    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
    const normalizedLines = data.lines.map((line) => {
      const unitCostUSD = line.unitCostUSD != null
        ? Number(line.unitCostUSD)
        : Math.round((Number(line.unitCost) / exchangeRate) * 100) / 100;
      const unitCostSYP = line.unitCostUSD != null
        ? Math.round(unitCostUSD * exchangeRate)
        : Number(line.unitCost);
      return {
        ...line,
        unitCost: unitCostSYP,
        unitCostUSD,
        totalCost: line.receivedQuantity * unitCostSYP,
        totalCostUSD: Math.round(line.receivedQuantity * unitCostUSD * 100) / 100,
      };
    });

    // Generate GRN number
    const grnNumber = await this.generateGRNNumber(tenantId);

    // Convert received date if needed
    let receivedDate = data.receivedDate;
    if (typeof receivedDate === 'string') {
      receivedDate = new Date(receivedDate);
    }
    if (!receivedDate || isNaN(receivedDate.getTime())) {
      receivedDate = new Date();
    }

    const grn = await prisma.goodsReceiptNote.create({
      data: {
        tenantId,
        purchaseOrderId: data.purchaseOrderId,
        supplierId,
        warehouseId: data.warehouseId,
        grnNumber,
        receivedDate,
        status: 'DRAFT' as any,
        receivedBy: userId || 'SYSTEM',
        notes: data.notes,
        lines: {
          create: normalizedLines.map((line) => ({
            tenantId,
            partId: line.partId,
            orderedQuantity: line.orderedQuantity,
            receivedQuantity: line.receivedQuantity,
            damagedQuantity: line.damagedQuantity || 0,
            unitCost: line.unitCost,
            unitCostUSD: line.unitCostUSD,
            totalCost: line.totalCost,
            totalCostUSD: line.totalCostUSD,
          })),
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        purchaseOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
        lines: {
          include: {
            part: {
              select: {
                id: true,
                partNumber: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return this.mapToGRNResponse(grn);
  }

  async getGRNs(
    tenantId: string,
    filters: GRNFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<GoodsReceiptNote>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { supplierId, warehouseId, purchaseOrderId, status, fromDate, toDate, search } = filters;

    const where: any = { tenantId };

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (purchaseOrderId) {
      where.purchaseOrderId = purchaseOrderId;
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.receivedDate = {};
      if (fromDate) {
        where.receivedDate.gte = fromDate;
      }
      if (toDate) {
        where.receivedDate.lte = toDate;
      }
    }

    if (search) {
      where.OR = [
        { grnNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [grns, total] = await Promise.all([
      prisma.goodsReceiptNote.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          purchaseOrder: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
          },
          lines: {
            include: {
              part: {
                select: {
                  id: true,
                  partNumber: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.goodsReceiptNote.count({ where }),
    ]);

    return {
      data: grns.map((grn) => this.mapToGRNResponse(grn)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getGRNById(id: string, tenantId: string): Promise<GoodsReceiptNote | null> {
    const grn = await prisma.goodsReceiptNote.findFirst({
      where: { id, tenantId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        purchaseOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
        lines: {
          include: {
            part: {
              select: {
                id: true,
                partNumber: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!grn) {
      return null;
    }

    return this.mapToGRNResponse(grn);
  }

  async updateGRN(id: string, tenantId: string, data: UpdateGRNDto): Promise<GoodsReceiptNote> {
    const existingGRN = await prisma.goodsReceiptNote.findFirst({
      where: { id, tenantId },
    });

    if (!existingGRN) {
      throw new Error('Goods Receipt Note not found');
    }

    const grn = await prisma.goodsReceiptNote.update({
      where: { id },
      data: {
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        receivedDate: data.receivedDate,
        status: data.status,
        notes: data.notes,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        purchaseOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
        lines: {
          include: {
            part: {
              select: {
                id: true,
                partNumber: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return this.mapToGRNResponse(grn);
  }

  async deleteGRN(id: string, tenantId: string): Promise<void> {
    const existingGRN = await prisma.goodsReceiptNote.findFirst({
      where: { id, tenantId },
    });

    if (!existingGRN) {
      throw new Error('Goods Receipt Note not found');
    }

    if (existingGRN.status !== 'DRAFT' && existingGRN.status !== 'PENDING') {
      throw new Error('Cannot delete completed or cancelled GRN');
    }

    await prisma.goodsReceiptNote.delete({
      where: { id },
    });
  }

  async addGRNLine(grnId: string, tenantId: string, data: CreateGRNLineDto): Promise<GoodsReceiptNote> {
    const grn = await prisma.goodsReceiptNote.findFirst({
      where: { id: grnId, tenantId },
    });

    if (!grn) {
      throw new Error('Goods Receipt Note not found');
    }

    if (grn.status !== 'DRAFT' && grn.status !== 'PENDING') {
      throw new Error('Cannot add lines to completed or cancelled GRN');
    }

    const part = await prisma.part.findFirst({ where: { id: data.partId, tenantId } });
    if (!part) throw new Error('Part not found');
    const damagedQuantity = data.damagedQuantity ?? 0;
    if (!Number.isInteger(data.orderedQuantity) || !Number.isInteger(data.receivedQuantity) || !Number.isInteger(damagedQuantity) ||
        data.orderedQuantity < 0 || data.receivedQuantity < 0 || data.receivedQuantity > data.orderedQuantity || damagedQuantity < 0 || damagedQuantity > data.receivedQuantity) {
      throw new Error('GRN quantities must be non-negative whole numbers and received quantity cannot exceed ordered quantity');
    }
    if (data.unitCost == null && data.unitCostUSD == null) throw new Error('Unit cost is required in USD or SYP');
    if (data.unitCost != null && data.unitCost < 0 || data.unitCostUSD != null && data.unitCostUSD < 0) throw new Error('Unit cost cannot be negative');
    const rate = await settingsService.getRequiredExchangeRate(tenantId);
    const unitCostUSD = data.unitCostUSD != null
      ? Number(data.unitCostUSD)
      : Math.round((Number(data.unitCost) / rate) * 100) / 100;
    const unitCost = data.unitCostUSD != null ? Math.round(unitCostUSD * rate) : Number(data.unitCost);
    await prisma.goodsReceiptNoteLine.create({
      data: {
        tenantId,
        grnId,
        partId: data.partId,
        orderedQuantity: data.orderedQuantity,
        receivedQuantity: data.receivedQuantity,
        damagedQuantity: data.damagedQuantity || 0,
        unitCost,
        unitCostUSD,
        totalCost: data.receivedQuantity * unitCost,
        totalCostUSD: Math.round(data.receivedQuantity * unitCostUSD * 100) / 100,
      },
    });

    return this.getGRNById(grnId, tenantId) as Promise<GoodsReceiptNote>;
  }

  async updateGRNLine(lineId: string, tenantId: string, data: UpdateGRNLineDto): Promise<GoodsReceiptNote> {
    const existingLine = await prisma.goodsReceiptNoteLine.findFirst({
      where: { id: lineId },
      include: {
        grn: true,
      },
    });

    if (!existingLine) {
      throw new Error('GRN line not found');
    }

    if (existingLine.grn.tenantId !== tenantId) {
      throw new Error('GRN does not belong to tenant');
    }

    if (existingLine.grn.status !== 'DRAFT' && existingLine.grn.status !== 'PENDING') {
      throw new Error('Cannot modify lines in completed or cancelled GRN');
    }

    const receivedQuantity = data.receivedQuantity ?? existingLine.receivedQuantity;
    const damagedQuantity = data.damagedQuantity ?? existingLine.damagedQuantity;
    const orderedQuantity = data.orderedQuantity ?? existingLine.orderedQuantity;
    if (!Number.isInteger(receivedQuantity) || !Number.isInteger(damagedQuantity) || !Number.isInteger(orderedQuantity) ||
        receivedQuantity < 0 || damagedQuantity < 0 || damagedQuantity > receivedQuantity || receivedQuantity > orderedQuantity) {
      throw new Error('GRN quantities must be non-negative whole numbers and damaged quantity cannot exceed received quantity');
    }

    if (data.unitCost != null && data.unitCost < 0 || data.unitCostUSD != null && data.unitCostUSD < 0) {
      throw new Error('Unit cost cannot be negative');
    }
    let unitCost = Number(existingLine.unitCost);
    let unitCostUSD = existingLine.unitCostUSD != null
      ? Number(existingLine.unitCostUSD)
      : Math.round((unitCost / await settingsService.getRequiredExchangeRate(tenantId)) * 100) / 100;
    if (data.unitCostUSD != null) {
      const rate = await settingsService.getRequiredExchangeRate(tenantId);
      unitCostUSD = Number(data.unitCostUSD);
      unitCost = Math.round(unitCostUSD * rate);
    } else if (data.unitCost != null) {
      const rate = await settingsService.getRequiredExchangeRate(tenantId);
      unitCost = Number(data.unitCost);
      unitCostUSD = Math.round((unitCost / rate) * 100) / 100;
    }
    const totalCost = receivedQuantity * unitCost;
    const totalCostUSD = Math.round(receivedQuantity * unitCostUSD * 100) / 100;

    await prisma.goodsReceiptNoteLine.update({
      where: { id: lineId },
      data: {
        orderedQuantity,
        receivedQuantity,
        damagedQuantity,
        unitCost,
        unitCostUSD,
        totalCost,
        totalCostUSD,
      },
    });

    return this.getGRNById(existingLine.grnId, tenantId) as Promise<GoodsReceiptNote>;
  }

  async removeGRNLine(lineId: string, tenantId: string): Promise<GoodsReceiptNote> {
    const existingLine = await prisma.goodsReceiptNoteLine.findFirst({
      where: { id: lineId },
      include: {
        grn: true,
      },
    });

    if (!existingLine) {
      throw new Error('GRN line not found');
    }

    if (existingLine.grn.tenantId !== tenantId) {
      throw new Error('GRN does not belong to tenant');
    }

    if (existingLine.grn.status !== 'DRAFT' && existingLine.grn.status !== 'PENDING') {
      throw new Error('Cannot remove lines from completed or cancelled GRN');
    }

    await prisma.goodsReceiptNoteLine.delete({
      where: { id: lineId },
    });

    return this.getGRNById(existingLine.grnId, tenantId) as Promise<GoodsReceiptNote>;
  }

  async completeGRN(id: string, tenantId: string, userId: string): Promise<GoodsReceiptNote> {
    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
    const grn = await prisma.$transaction(async (tx) => {
      const current = await tx.goodsReceiptNote.findFirst({
        where: { id, tenantId },
        include: { lines: { include: { part: true } }, supplier: true },
      });
      if (!current) throw new Error('Goods Receipt Note not found');
      if (current.status !== 'DRAFT' && current.status !== 'PENDING') {
        throw new Error('Only draft or pending GRNs can be completed');
      }
      if (current.lines.length === 0) throw new Error('Cannot complete GRN without lines');

      const claim = await tx.goodsReceiptNote.updateMany({
        where: { id, tenantId, status: current.status },
        data: { status: 'COMPLETED', receivedBy: userId },
      });
      if (claim.count !== 1) throw new Error('GRN status changed; reload and retry');
      await ensureDefaultAccounts(tenantId, tx);

      for (const line of current.lines) {
        const netQuantity = line.receivedQuantity - Number(line.damagedQuantity || 0);
        const unitCostSYP = Number(line.unitCost);
        const unitCostUSD = line.unitCostUSD != null
          ? Number(line.unitCostUSD)
          : Math.round((unitCostSYP / exchangeRate) * 100) / 100;

        if (netQuantity > 0) {
          const part = line.part;
          const currentQuantity = part.quantity;
          const newQuantity = currentQuantity + netQuantity;
          const currentCostUSD = part.costUSD != null
            ? Number(part.costUSD)
            : Math.round((Number(part.costSYP || 0) / exchangeRate) * 100) / 100;
          const currentCostSYP = part.costUSD != null
            ? Math.round(currentCostUSD * exchangeRate)
            : Number(part.costSYP || 0);
          const updatedPart = await tx.part.updateMany({
            where: { id: part.id, tenantId, quantity: currentQuantity },
            data: {
              quantity: { increment: netQuantity },
              costSYP: currentQuantity > 0
                ? (currentCostSYP * currentQuantity + unitCostSYP * netQuantity) / newQuantity
                : unitCostSYP,
              costUSD: currentQuantity > 0
                ? (currentCostUSD * currentQuantity + unitCostUSD * netQuantity) / newQuantity
                : unitCostUSD,
            },
          });
          if (updatedPart.count !== 1) throw new Error(`Stock changed concurrently for part ${part.name}`);

          await tx.inventoryTransaction.create({
            data: {
              tenantId,
              partId: line.partId,
              type: 'STOCK_IN',
              quantity: netQuantity,
              costSYP: unitCostSYP,
              costUSD: unitCostUSD,
              reference: current.grnNumber,
              notes: `Received via GRN ${current.grnNumber}`,
              createdBy: userId,
            },
          });
        }

        const purchaseOrderLine = await tx.purchaseOrderItem.findFirst({
          where: { purchaseOrderId: current.purchaseOrderId, partId: line.partId },
        });
        if (purchaseOrderLine) {
          await tx.purchaseOrderItem.update({
            where: { id: purchaseOrderLine.id },
            data: { receivedQty: { increment: line.receivedQuantity } },
          });
        }
      }

      const purchaseOrderLines = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: current.purchaseOrderId },
        select: { quantity: true, receivedQty: true },
      });
      if (purchaseOrderLines.length > 0 && purchaseOrderLines.every((line) => line.receivedQty >= line.quantity)) {
        await tx.purchaseOrder.update({
          where: { id: current.purchaseOrderId },
          data: { status: 'RECEIVED' },
        });
      }

      const journalGRN = {
        ...current,
        status: 'COMPLETED',
        lines: current.lines.map((line) => ({
          ...line,
          unitCostUSD: line.unitCostUSD != null
            ? Number(line.unitCostUSD)
            : Math.round((Number(line.unitCost) / exchangeRate) * 100) / 100,
        })),
      };
      await createGRNJournalEntry(journalGRN, tenantId, userId, tx);
      return tx.goodsReceiptNote.findFirst({
        where: { id, tenantId },
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          purchaseOrder: { select: { id: true, orderNumber: true, status: true } },
          lines: { include: { part: { select: { id: true, partNumber: true, name: true } } } },
        },
      });
    }, { isolationLevel: 'Serializable' });

    if (!grn) throw new Error('GRN not found after completion');
    return this.mapToGRNResponse(grn);
  }

  async getPendingGRNs(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<GoodsReceiptNote>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const where = {
      tenantId,
      status: 'DRAFT' as any,
    };

    const [grns, total] = await Promise.all([
      prisma.goodsReceiptNote.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          purchaseOrder: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
          },
          lines: {
            include: {
              part: {
                select: {
                  id: true,
                  partNumber: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.goodsReceiptNote.count({ where }),
    ]);

    return {
      data: grns.map((grn) => this.mapToGRNResponse(grn)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async generateGRNNumber(_tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const sequence = await prisma.goodsReceiptNoteNumberSequence.upsert({
      where: { year },
      create: { year, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
    });
    return `GRN-${year}-${String(sequence.lastValue).padStart(4, '0')}`;
  }

  private mapToGRNResponse(grn: any): GoodsReceiptNote {
    return {
      id: grn.id,
      tenantId: grn.tenantId,
      grnNumber: grn.grnNumber,
      purchaseOrderId: grn.purchaseOrderId,
      supplierId: grn.supplierId,
      warehouseId: grn.warehouseId,
      receivedDate: grn.receivedDate,
      status: grn.status,
      receivedBy: grn.receivedBy,
      notes: grn.notes,
      createdAt: grn.createdAt,
      updatedAt: grn.updatedAt,
      supplier: grn.supplier,
      warehouse: grn.warehouse,
      purchaseOrder: grn.purchaseOrder,
      lines: grn.lines?.map((line: any) => ({
        id: line.id,
        grnId: line.grnId,
        partId: line.partId,
        orderedQuantity: line.orderedQuantity,
        receivedQuantity: line.receivedQuantity,
        damagedQuantity: line.damagedQuantity,
        unitCost: Number(line.unitCost),
        unitCostUSD: line.unitCostUSD == null ? null : Number(line.unitCostUSD),
        totalCost: Number(line.totalCost),
        totalCostUSD: line.totalCostUSD == null ? null : Number(line.totalCostUSD),
        createdAt: line.createdAt,
        part: line.part,
      })),
    };
  }
}
