import prisma from '../../config/database';
import {
  InventoryCount,
  CreateInventoryCountInput,
  UpdateInventoryCountInput,
  InventoryCountItem,
  CreateInventoryCountItemInput,
  UpdateInventoryCountItemInput,
  InventoryCountFilters,
  PaginationParams,
  PaginatedResponse
} from './types';

export class InventoryCountService {
  // ============================================
  // INVENTORY COUNTS
  // ============================================

  async createCount(tenantId: string, userId: string, data: CreateInventoryCountInput): Promise<InventoryCount> {
    // Verify warehouse exists and belongs to tenant if provided
    if (data.warehouseId) {
      const warehouse = await prisma.warehouse.findFirst({
        where: { id: data.warehouseId, tenantId },
      });

      if (!warehouse) {
        throw new Error('Warehouse not found');
      }
    }

    // Generate count number
    const countNumber = await this.generateCountNumber(tenantId);

    const count = await prisma.inventoryCount.create({
      data: {
        tenantId,
        countNumber,
        countType: data.countType as any,
        warehouseId: data.warehouseId,
        scheduledDate: data.scheduledDate,
        status: 'SCHEDULED',
        notes: data.notes,
        countedBy: userId,
      },
    });

    return this.getCountById(tenantId, count.id);
  }

  async getCounts(
    tenantId: string,
    filters: InventoryCountFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<InventoryCount>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { warehouseId, status, dateFrom, dateTo, countNumber } = filters;

    const where: any = { tenantId };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (status) {
      where.status = status;
    }

    if (countNumber) {
      where.countNumber = { contains: countNumber, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) {
        where.scheduledDate.gte = dateFrom;
      }
      if (dateTo) {
        where.scheduledDate.lte = dateTo;
      }
    }

    const [data, total] = await Promise.all([
      prisma.inventoryCount.findMany({
        where,
        include: {
          items: {
            include: {
              part: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventoryCount.count({ where }),
    ]);

    // Transform data to match expected format
    const transformedData = await Promise.all(
      data.map(async (count: any) => {
        let warehouse = null;
        let counter = null;
        let approver = null;

        if (count.warehouseId) {
          warehouse = await prisma.warehouse.findUnique({
            where: { id: count.warehouseId },
            select: {
              id: true,
              name: true,
            },
          });
        }

        if (count.countedBy) {
          counter = await prisma.user.findUnique({
            where: { id: count.countedBy },
            select: {
              id: true,
              fullName: true,
            },
          });
        }

        if (count.approvedBy) {
          approver = await prisma.user.findUnique({
            where: { id: count.approvedBy },
            select: {
              id: true,
              fullName: true,
            },
          });
        }

        const transformedItems = count.items.map((item: any) => ({
          id: item.id,
          countId: item.countId,
          partId: item.partId,
          partName: item.part.name,
          partCode: item.part.partNumber,
          expectedQty: item.expectedQty,
          actualQty: item.actualQty,
          varianceQty: item.varianceQty,
          unitCostSYP: item.unitCostSYP,
          unitCostUSD: item.unitCostUSD,
          varianceSYP: item.varianceSYP,
          varianceUSD: item.varianceUSD,
          notes: item.notes,
          part: {
            id: item.part.id,
            name: item.part.name,
            partCode: item.part.partNumber,
          },
        }));

        return {
          ...count,
          warehouse,
          counter,
          approver,
          items: transformedItems,
        };
      })
    );

    return {
      data: transformedData as InventoryCount[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCountById(tenantId: string, countId: string): Promise<InventoryCount> {
    const count = await prisma.inventoryCount.findFirst({
      where: { id: countId, tenantId },
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!count) {
      throw new Error('Inventory count not found');
    }

    // Get related data
    let warehouse = null;
    let counter = null;
    let approver = null;

    if (count.warehouseId) {
      warehouse = await prisma.warehouse.findUnique({
        where: { id: count.warehouseId },
        select: {
          id: true,
          name: true,
        },
      });
    }

    if (count.countedBy) {
      counter = await prisma.user.findUnique({
        where: { id: count.countedBy },
        select: {
          id: true,
          fullName: true,
        },
      });
    }

    if (count.approvedBy) {
      approver = await prisma.user.findUnique({
        where: { id: count.approvedBy },
        select: {
          id: true,
          fullName: true,
        },
      });
    }

    // Transform items to match expected format
    const transformedItems = count.items.map((item: any) => ({
      id: item.id,
      countId: item.countId,
      partId: item.partId,
      partName: item.part.name,
      partCode: item.part.code,
      expectedQty: item.expectedQty,
      actualQty: item.actualQty,
      varianceQty: item.varianceQty,
      unitCostSYP: item.unitCostSYP,
      unitCostUSD: item.unitCostUSD,
      varianceSYP: item.varianceSYP,
      varianceUSD: item.varianceUSD,
      notes: item.notes,
      part: {
        id: item.part.id,
        name: item.part.name,
        code: item.part.partNumber,
      },
    }));

    return {
      ...count,
      warehouse,
      counter,
      approver,
      items: transformedItems,
    } as InventoryCount;
  }

  async updateCount(tenantId: string, countId: string, data: UpdateInventoryCountInput): Promise<InventoryCount> {
    // Verify count exists and belongs to tenant
    const existingCount = await prisma.inventoryCount.findFirst({
      where: { id: countId, tenantId },
    });

    if (!existingCount) {
      throw new Error('Inventory count not found');
    }

    const count = await prisma.inventoryCount.update({
      where: { id: countId },
      data: {
        status: data.status,
        actualDate: data.actualDate,
        notes: data.notes,
      },
    });

    return this.getCountById(tenantId, count.id);
  }

  async approveCount(tenantId: string, countId: string, userId: string): Promise<InventoryCount> {
    // Verify count exists and belongs to tenant
    const count = await prisma.inventoryCount.findFirst({
      where: { id: countId, tenantId },
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!count) {
      throw new Error('Inventory count not found');
    }

    if (count.status !== 'IN_PROGRESS') {
      throw new Error('Count must be in progress before approval');
    }

    // Update inventory quantities based on count
    for (const item of count.items) {
      const variance = item.actualQty - item.expectedQty;
      
      if (variance !== 0 && count.warehouseId) {
        // Create inventory transaction to adjust quantity
        await prisma.inventoryTransaction.create({
          data: {
            tenantId,
            partId: item.partId,
            warehouseId: count.warehouseId,
            type: 'ADJUSTMENT',
            quantity: Math.abs(variance),
            costSYP: item.part.costSYP,
            costUSD: item.part.costUSD,
            reference: `Inventory count ${count.countNumber}`,
            notes: `Inventory count adjustment for ${item.part.name}`,
          },
        });

        // Update part quantity directly
        await prisma.part.update({
          where: { id: item.partId },
          data: {
            quantity: item.actualQty,
          },
        });
      }
    }

    // Mark count as approved
    const updatedCount = await prisma.inventoryCount.update({
      where: { id: countId },
      data: {
        status: 'COMPLETED',
        approvedBy: userId,
        approvedAt: new Date(),
        actualDate: new Date(),
      },
    });

    return this.getCountById(tenantId, updatedCount.id);
  }

  async deleteCount(tenantId: string, countId: string): Promise<void> {
    // Verify count exists and belongs to tenant
    const count = await prisma.inventoryCount.findFirst({
      where: { id: countId, tenantId },
    });

    if (!count) {
      throw new Error('Inventory count not found');
    }

    if (count.status === 'COMPLETED') {
      throw new Error('Cannot delete completed inventory count');
    }

    // Delete items first
    await prisma.inventoryCountItem.deleteMany({
      where: { countId: countId },
    });

    // Delete count
    await prisma.inventoryCount.delete({
      where: { id: countId },
    });
  }

  // ============================================
  // INVENTORY COUNT ITEMS
  // ============================================

  async addItem(tenantId: string, countId: string, data: CreateInventoryCountItemInput): Promise<InventoryCountItem> {
    // Verify count exists and belongs to tenant
    const count = await prisma.inventoryCount.findFirst({
      where: { id: countId, tenantId },
    });

    if (!count) {
      throw new Error('Inventory count not found');
    }

    if (count.status === 'COMPLETED') {
      throw new Error('Cannot add items to completed count');
    }

    // Get part
    const part = await prisma.part.findFirst({
      where: { id: data.partId, tenantId },
    });

    if (!part) {
      throw new Error('Part not found');
    }

    // Check if item already exists
    const existingItem = await prisma.inventoryCountItem.findFirst({
      where: {
        countId: countId,
        partId: data.partId,
      },
    });

    if (existingItem) {
      throw new Error('Item already exists in count');
    }

    const varianceQty = data.actualQty - data.expectedQty;
    const varianceSYP = varianceQty * Number(part.costSYP);

    const item = await prisma.inventoryCountItem.create({
      data: {
        tenantId,
        countId: countId,
        partId: data.partId,
        expectedQty: data.expectedQty,
        actualQty: data.actualQty,
        varianceQty,
        unitCostSYP: part.costSYP,
        unitCostUSD: part.costUSD,
        varianceSYP,
        varianceUSD: part.costUSD ? varianceQty * Number(part.costUSD) : null,
        notes: data.notes,
      },
    });

    // Transform to match expected format
    return {
      id: item.id,
      countId: item.countId,
      partId: item.partId,
      partName: part.name,
      partCode: part.partNumber,
      expectedQty: item.expectedQty,
      actualQty: item.actualQty,
      varianceQty: item.varianceQty,
      unitCostSYP: Number(item.unitCostSYP),
      unitCostUSD: item.unitCostUSD ? Number(item.unitCostUSD) : null,
      varianceSYP: Number(item.varianceSYP),
      varianceUSD: item.varianceUSD ? Number(item.varianceUSD) : null,
      notes: item.notes,
      part: {
        id: part.id,
        name: part.name,
        code: part.partNumber,
      },
    } as InventoryCountItem;
  }

  async updateItem(tenantId: string, countId: string, itemId: string, data: UpdateInventoryCountItemInput): Promise<InventoryCountItem> {
    // Verify item exists and belongs to count
    const item = await prisma.inventoryCountItem.findFirst({
      where: { id: itemId, countId: countId },
      include: {
        count: true,
        part: true,
      },
    });

    if (!item) {
      throw new Error('Inventory count item not found');
    }

    if (item.count.tenantId !== tenantId) {
      throw new Error('Access denied');
    }

    if (item.count.status === 'COMPLETED') {
      throw new Error('Cannot update items in completed count');
    }

    const varianceQty = data.actualQty - item.expectedQty;
    const varianceSYP = varianceQty * Number(item.part.costSYP);

    const updatedItem = await prisma.inventoryCountItem.update({
      where: { id: itemId },
      data: {
        actualQty: data.actualQty,
        varianceQty,
        varianceSYP,
        varianceUSD: item.part.costUSD ? varianceQty * Number(item.part.costUSD) : null,
        notes: data.notes,
      },
    });

    // Transform to match expected format
    return {
      id: updatedItem.id,
      countId: updatedItem.countId,
      partId: updatedItem.partId,
      partName: item.part.name,
      partCode: item.part.partNumber,
      expectedQty: updatedItem.expectedQty,
      actualQty: updatedItem.actualQty,
      varianceQty: updatedItem.varianceQty,
      unitCostSYP: Number(updatedItem.unitCostSYP),
      unitCostUSD: updatedItem.unitCostUSD ? Number(updatedItem.unitCostUSD) : null,
      varianceSYP: Number(updatedItem.varianceSYP),
      varianceUSD: updatedItem.varianceUSD ? Number(updatedItem.varianceUSD) : null,
      notes: updatedItem.notes,
      part: {
        id: item.part.id,
        name: item.part.name,
        code: item.part.partNumber,
      },
    } as InventoryCountItem;
  }

  async deleteItem(tenantId: string, countId: string, itemId: string): Promise<void> {
    // Verify item exists and belongs to count
    const item = await prisma.inventoryCountItem.findFirst({
      where: { id: itemId, countId: countId },
      include: {
        count: true,
      },
    });

    if (!item) {
      throw new Error('Inventory count item not found');
    }

    if (item.count.tenantId !== tenantId) {
      throw new Error('Access denied');
    }

    if (item.count.status === 'COMPLETED') {
      throw new Error('Cannot delete items from completed count');
    }

    await prisma.inventoryCountItem.delete({
      where: { id: itemId },
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async generateCountNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `IC-${year}`;
    
    // Find the last count number for this year
    const lastCount = await prisma.inventoryCount.findFirst({
      where: {
        tenantId,
        countNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        countNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastCount) {
      const lastSequence = parseInt(lastCount.countNumber.split('-')[2] || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(4, '0')}`;
  }
}
