import { PartRepository } from '../../../application/inventory/interfaces/PartRepository';
import { Part } from '../../../domain/inventory/entities/Part';
import { PartNumber } from '../../../domain/inventory/value-objects/PartNumber';
import prisma from '../../../config/database';

export class PrismaPartRepository implements PartRepository {
  async findById(id: string): Promise<Part | null> {
    const part = await prisma.part.findUnique({
      where: { id },
    });

    if (!part) {
      return null;
    }

    return this.mapToDomain(part);
  }

  async findByPartNumber(partNumber: PartNumber): Promise<Part | null> {
    const part = await prisma.part.findUnique({
      where: { partNumber: partNumber.getValue() },
    });

    if (!part) {
      return null;
    }

    return this.mapToDomain(part);
  }

  async findByTenantId(tenantId: string): Promise<Part[]> {
    const parts = await prisma.part.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return parts.map(p => this.mapToDomain(p));
  }

  async findByCategory(categoryId: string): Promise<Part[]> {
    const parts = await prisma.part.findMany({
      where: { categoryId },
      orderBy: { name: 'asc' },
    });

    return parts.map(p => this.mapToDomain(p));
  }

  async findBySupplier(supplierId: string): Promise<Part[]> {
    const parts = await prisma.part.findMany({
      where: { supplierId },
      orderBy: { name: 'asc' },
    });

    return parts.map(p => this.mapToDomain(p));
  }

  async create(part: Part): Promise<Part> {
    const createdPart = await prisma.part.create({
      data: {
        id: part.id,
        tenantId: part.tenantId,
        partNumber: part.partNumber.getValue(),
        name: part.name,
        nameAr: part.nameAr,
        nameEn: part.nameEn,
        categoryId: part.categoryId,
        supplierId: part.supplierId,
        description: part.description,
        costSYP: part.costSYP,
        costUSD: part.costUSD,
        sellingPriceSYP: part.sellingPriceSYP,
        sellingPriceUSD: part.sellingPriceUSD,
        quantity: part.quantity,
        minQuantity: part.minQuantity,
        location: part.location,
        isActive: part.isActive,
        createdAt: part.createdAt,
        updatedAt: part.updatedAt,
      },
    });

    return this.mapToDomain(createdPart);
  }

  async update(part: Part): Promise<Part> {
    const updatedPart = await prisma.part.update({
      where: { id: part.id },
      data: {
        name: part.name,
        nameAr: part.nameAr,
        nameEn: part.nameEn,
        categoryId: part.categoryId,
        supplierId: part.supplierId,
        description: part.description,
        costSYP: part.costSYP,
        costUSD: part.costUSD,
        sellingPriceSYP: part.sellingPriceSYP,
        sellingPriceUSD: part.sellingPriceUSD,
        quantity: part.quantity,
        minQuantity: part.minQuantity,
        location: part.location,
        isActive: part.isActive,
        updatedAt: part.updatedAt,
      },
    });

    return this.mapToDomain(updatedPart);
  }

  async delete(id: string): Promise<void> {
    await prisma.part.delete({
      where: { id },
    });
  }

  private mapToDomain(prismaPart: any): Part {
    const partNumber = new PartNumber(prismaPart.partNumber);

    return new Part(
      prismaPart.id,
      prismaPart.tenantId,
      partNumber,
      prismaPart.name,
      Number(prismaPart.costSYP),
      Number(prismaPart.sellingPriceSYP),
      prismaPart.quantity,
      prismaPart.minQuantity,
      prismaPart.isActive,
      prismaPart.createdAt,
      prismaPart.updatedAt,
      prismaPart.nameAr,
      prismaPart.nameEn,
      prismaPart.categoryId,
      prismaPart.supplierId,
      prismaPart.description,
      prismaPart.costUSD ? Number(prismaPart.costUSD) : undefined,
      prismaPart.sellingPriceUSD ? Number(prismaPart.sellingPriceUSD) : undefined,
      prismaPart.location
    );
  }
}
