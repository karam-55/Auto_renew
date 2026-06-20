import prisma from '../../config/database';
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
import { Logger } from '../../infrastructure/logging/logger';
import { createGRNJournalEntry } from '../accounting/automatic-journal-entries';

export class GRNService {
  async createGRN(tenantId: string, data: CreateGRNDto): Promise<GoodsReceiptNote> {
    // Check if purchase order exists and belongs to tenant
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id: data.purchaseOrderId, tenantId },
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
      if (line.receivedQuantity < 0) {
        throw new Error('Received quantity cannot be negative');
      }
      if (line.damagedQuantity !== undefined && line.damagedQuantity < 0) {
        throw new Error('Damaged quantity cannot be negative');
      }
      if (line.unitCost < 0) {
        throw new Error('Unit cost cannot be negative');
      }

      // Validate parts in lines
      if (line.partId) {
        const part = await prisma.part.findFirst({
          where: { id: line.partId, tenantId },
        });
        if (!part) {
          throw new Error(`Part with ID ${line.partId} not found`);
        }
      }
    }

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
        receivedBy: 'SYSTEM', // Should be passed from auth context
        notes: data.notes,
        lines: {
          create: data.lines?.map((line) => ({
            tenantId,
            partId: line.partId,
            orderedQuantity: line.orderedQuantity || 0,
            receivedQuantity: line.receivedQuantity,
            damagedQuantity: line.damagedQuantity || 0,
            unitCost: line.unitCost || 0,
            totalCost: (line.receivedQuantity * (line.unitCost || 0)),
          })) || [],
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

    if (existingGRN.status === 'COMPLETED') {
      throw new Error('Cannot delete completed GRN');
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

    if (grn.status === 'COMPLETED') {
      throw new Error('Cannot add lines to completed GRN');
    }

    await prisma.goodsReceiptNoteLine.create({
      data: {
        tenantId,
        grnId,
        partId: data.partId,
        orderedQuantity: data.orderedQuantity,
        receivedQuantity: data.receivedQuantity,
        damagedQuantity: data.damagedQuantity || 0,
        unitCost: data.unitCost,
        totalCost: data.receivedQuantity * data.unitCost,
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

    if (existingLine.grn.status === 'COMPLETED') {
      throw new Error('Cannot modify completed GRN');
    }

    const receivedQuantity = data.receivedQuantity ?? existingLine.receivedQuantity;
    const unitCost = data.unitCost ?? Number(existingLine.unitCost);
    const totalCost = receivedQuantity * unitCost;

    await prisma.goodsReceiptNoteLine.update({
      where: { id: lineId },
      data: {
        orderedQuantity: data.orderedQuantity,
        receivedQuantity,
        damagedQuantity: data.damagedQuantity,
        unitCost,
        totalCost,
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

    if (existingLine.grn.status === 'COMPLETED') {
      throw new Error('Cannot modify completed GRN');
    }

    await prisma.goodsReceiptNoteLine.delete({
      where: { id: lineId },
    });

    return this.getGRNById(existingLine.grnId, tenantId) as Promise<GoodsReceiptNote>;
  }

  async completeGRN(id: string, tenantId: string, userId: string): Promise<GoodsReceiptNote> {
    const grn = await prisma.goodsReceiptNote.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          include: {
            part: true,
          },
        },
        supplier: true,
      },
    });

    if (!grn) {
      throw new Error('Goods Receipt Note not found');
    }

    if (grn.status === 'COMPLETED') {
      throw new Error('GRN is already completed');
    }

    const updated = await prisma.goodsReceiptNote.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        receivedBy: userId,
      },
    });

    // Create inventory transactions for each line (STOCK_IN)
    for (const line of grn.lines) {
      const netQuantity = line.receivedQuantity - (line.damagedQuantity || 0);

      if (netQuantity > 0) {
        // Create STOCK_IN transaction
        await prisma.inventoryTransaction.create({
          data: {
            tenantId,
            partId: line.partId,
            type: 'STOCK_IN',
            quantity: netQuantity,
            costSYP: line.unitCost,
            reference: grn.grnNumber,
            notes: `Received via GRN ${grn.grnNumber}`,
          },
        });

        // Update part quantity
        await prisma.part.update({
          where: { id: line.partId },
          data: {
            quantity: {
              increment: netQuantity,
            },
          },
        });
      }
    }

    // Create auto-journal entry for GRN
    try {
      const grnWithDetails = await prisma.goodsReceiptNote.findUnique({
        where: { id },
        include: {
          lines: true,
          supplier: true,
        },
      });

      if (grnWithDetails) {
        await createGRNJournalEntry(grnWithDetails, tenantId, userId);
      }
    } catch (error) {
      Logger.error('Error creating journal entry for GRN:', error);
      throw new Error('GRN completed but journal entry creation failed. Please check the chart of accounts setup.');
    }

    return this.getGRNById(id, tenantId) as Promise<GoodsReceiptNote>;
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

  private async generateGRNNumber(tenantId: string): Promise<string> {
    const prefix = 'GRN';
    const year = new Date().getFullYear();
    
    const lastGRN = await prisma.goodsReceiptNote.findFirst({
      where: {
        tenantId,
        grnNumber: {
          startsWith: `${prefix}-${year}`,
        },
      },
      orderBy: {
        grnNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastGRN) {
      const lastSequence = parseInt(lastGRN.grnNumber.split('-')[2] || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;
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
        totalCost: Number(line.totalCost),
        createdAt: line.createdAt,
        part: line.part,
      })),
    };
  }
}
