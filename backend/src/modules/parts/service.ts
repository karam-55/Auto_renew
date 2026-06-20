import prisma from '../../config/database';
import {
  Part,
  CreatePartDto,
  UpdatePartDto,
  PartFilters,
  PaginationParams,
  PaginatedResponse,
  PartStatus,
} from './types';

export class PartService {
  async createPart(tenantId: string, data: CreatePartDto): Promise<Part> {
    // Check if part number already exists
    const existingPart = await prisma.part.findUnique({
      where: { partNumber: data.partNumber },
    });

    if (existingPart) {
      throw new Error('Part with this part number already exists');
    }

    const part = await prisma.part.create({
      data: {
        tenantId,
        partNumber: data.partNumber,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        costSYP: data.costSYP,
        costUSD: data.costUSD,
        sellingPriceSYP: data.sellingPriceSYP,
        sellingPriceUSD: data.sellingPriceUSD,
        quantity: data.quantity ?? 0,
        minQuantity: data.minQuantity ?? 5,
        location: data.location,
        isActive: data.isActive ?? true,
      },
    });

    return this.mapToPartResponse(part);
  }

  async getParts(
    tenantId: string,
    filters: PartFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Part>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { categoryId, supplierId, status, minQuantity, maxQuantity, search } = filters;

    const where: any = { tenantId };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      if (status === PartStatus.OUT_OF_STOCK) {
        where.quantity = 0;
      } else if (status === PartStatus.DISCONTINUED) {
        where.isActive = false;
      } else {
        where.isActive = true;
      }
    }

    if (minQuantity !== undefined) {
      where.quantity = { ...where.quantity, gte: minQuantity };
    }

    if (maxQuantity !== undefined) {
      where.quantity = { ...where.quantity, lte: maxQuantity };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.part.count({ where }),
    ]);

    return {
      data: parts.map((part) => this.mapToPartResponse(part)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPartById(id: string, tenantId: string): Promise<Part | null> {
    const part = await prisma.part.findFirst({
      where: { id, tenantId },
    });

    if (!part) {
      return null;
    }

    return this.mapToPartResponse(part);
  }

  async updatePart(id: string, tenantId: string, data: UpdatePartDto): Promise<Part> {
    // Check if part exists and belongs to tenant
    const existingPart = await prisma.part.findFirst({
      where: { id, tenantId },
    });

    if (!existingPart) {
      throw new Error('Part not found');
    }

    // If updating part number, check if new part number is available
    if (data.partNumber && data.partNumber !== existingPart.partNumber) {
      const partNumberExists = await prisma.part.findUnique({
        where: { partNumber: data.partNumber },
      });

      if (partNumberExists) {
        throw new Error('Part with this part number already exists');
      }
    }

    const part = await prisma.part.update({
      where: { id },
      data: {
        partNumber: data.partNumber,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        costSYP: data.costSYP,
        costUSD: data.costUSD,
        sellingPriceSYP: data.sellingPriceSYP,
        sellingPriceUSD: data.sellingPriceUSD,
        quantity: data.quantity,
        minQuantity: data.minQuantity,
        location: data.location,
        isActive: data.isActive,
      },
    });

    return this.mapToPartResponse(part);
  }

  async deletePart(id: string, tenantId: string): Promise<void> {
    // Check if part exists and belongs to tenant
    const existingPart = await prisma.part.findFirst({
      where: { id, tenantId },
    });

    if (!existingPart) {
      throw new Error('Part not found');
    }

    // Check if part is used in any inventory transactions
    const inventoryTransactionsCount = await prisma.inventoryTransaction.count({
      where: { partId: id },
    });

    if (inventoryTransactionsCount > 0) {
      throw new Error('Cannot delete part with existing inventory transactions');
    }

    // Check if part is used in any purchase order items
    const purchaseOrderItemsCount = await prisma.purchaseOrderItem.count({
      where: { partId: id },
    });

    if (purchaseOrderItemsCount > 0) {
      throw new Error('Cannot delete part with existing purchase order items');
    }

    // Check if part is used in any invoice items
    const invoiceItemsCount = await prisma.invoiceItem.count({
      where: { partId: id },
    });

    if (invoiceItemsCount > 0) {
      throw new Error('Cannot delete part with existing invoice items');
    }

    await prisma.part.delete({
      where: { id },
    });
  }

  async searchParts(tenantId: string, query: string): Promise<Part[]> {
    const parts = await prisma.part.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { nameAr: { contains: query, mode: 'insensitive' } },
          { nameEn: { contains: query, mode: 'insensitive' } },
          { partNumber: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    return parts.map((part) => this.mapToPartResponse(part));
  }

  async updateQuantity(id: string, tenantId: string, quantityChange: number): Promise<Part> {
    const part = await prisma.part.findFirst({
      where: { id, tenantId },
    });

    if (!part) {
      throw new Error('Part not found');
    }

    const newQuantity = part.quantity + quantityChange;

    if (newQuantity < 0) {
      throw new Error('Insufficient quantity');
    }

    const updatedPart = await prisma.part.update({
      where: { id },
      data: {
        quantity: newQuantity,
      },
    });

    return this.mapToPartResponse(updatedPart);
  }

  async getLowStockParts(tenantId: string): Promise<Part[]> {
    const parts = await prisma.part.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: [{ quantity: 'asc' }, { name: 'asc' }],
    });

    // Filter parts where quantity <= minQuantity
    const lowStockParts = parts.filter((part) => part.quantity <= part.minQuantity);

    return lowStockParts.map((part) => this.mapToPartResponse(part));
  }

  private mapToPartResponse(part: any): Part {
    return {
      id: part.id,
      tenantId: part.tenantId,
      partNumber: part.partNumber,
      name: part.name,
      nameAr: part.nameAr,
      nameEn: part.nameEn,
      description: part.description,
      categoryId: part.categoryId,
      supplierId: part.supplierId,
      costSYP: Number(part.costSYP),
      costUSD: part.costUSD ? Number(part.costUSD) : undefined,
      sellingPriceSYP: Number(part.sellingPriceSYP),
      sellingPriceUSD: part.sellingPriceUSD ? Number(part.sellingPriceUSD) : undefined,
      quantity: part.quantity,
      minQuantity: part.minQuantity,
      location: part.location,
      isActive: part.isActive,
      createdAt: part.createdAt,
      updatedAt: part.updatedAt,
    };
  }
}
