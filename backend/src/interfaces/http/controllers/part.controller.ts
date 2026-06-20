import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { CreatePart } from '../../../application/inventory/use-cases/CreatePart';
import { UpdatePart } from '../../../application/inventory/use-cases/UpdatePart';
import { GetPart } from '../../../application/inventory/use-cases/GetPart';
import { ListParts } from '../../../application/inventory/use-cases/ListParts';
import { PrismaPartRepository } from '../../../infrastructure/inventory/repositories/PrismaPartRepository';
import prisma from '../../../config/database';

export class PartController {
  private createPart: CreatePart;
  private updatePart: UpdatePart;
  private getPart: GetPart;
  private listParts: ListParts;

  constructor() {
    const partRepository = new PrismaPartRepository();
    this.createPart = new CreatePart(partRepository);
    this.updatePart = new UpdatePart(partRepository);
    this.getPart = new GetPart(partRepository);
    this.listParts = new ListParts(partRepository);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        name,
        costSYP,
        sellingPriceSYP,
        nameAr,
        nameEn,
        categoryId,
        supplierId,
        description,
        costUSD,
        sellingPriceUSD,
        quantity,
        minQuantity,
        location,
        isActive,
      } = req.body;

      const result = await this.createPart.execute(
        tenantId,
        name,
        costSYP,
        sellingPriceSYP,
        nameAr,
        nameEn,
        categoryId,
        supplierId,
        description,
        costUSD,
        sellingPriceUSD,
        quantity,
        minQuantity,
        location,
        isActive
      );

      res.status(201).json({
        id: result.part.id,
        tenantId: result.part.tenantId,
        partNumber: result.part.partNumber.getValue(),
        name: result.part.name,
        nameAr: result.part.nameAr,
        nameEn: result.part.nameEn,
        categoryId: result.part.categoryId,
        supplierId: result.part.supplierId,
        description: result.part.description,
        costSYP: result.part.costSYP,
        costUSD: result.part.costUSD,
        sellingPriceSYP: result.part.sellingPriceSYP,
        sellingPriceUSD: result.part.sellingPriceUSD,
        quantity: result.part.quantity,
        minQuantity: result.part.minQuantity,
        location: result.part.location,
        isActive: result.part.isActive,
        createdAt: result.part.createdAt,
        updatedAt: result.part.updatedAt,
      });
    } catch (error) {
      Logger.error('Create part error:', error);
      res.status(500).json({ error: 'Failed to create part' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        nameAr,
        nameEn,
        description,
        costSYP,
        costUSD,
        sellingPriceSYP,
        sellingPriceUSD,
        minQuantity,
        location,
        categoryId,
        supplierId,
      } = req.body;

      const part = await this.updatePart.execute(
        id,
        name,
        nameAr,
        nameEn,
        description,
        costSYP,
        costUSD,
        sellingPriceSYP,
        sellingPriceUSD,
        minQuantity,
        location,
        categoryId,
        supplierId
      );

      res.json({
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
      });
    } catch (error) {
      Logger.error('Update part error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update part';
      if (errorMessage === 'Part not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to update part' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const part = await this.getPart.execute(id);

      res.json({
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
      });
    } catch (error) {
      Logger.error('Get part error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get part';
      if (errorMessage === 'Part not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to get part' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, categoryId, supplierId } = req.query;

      let parts;
      if (categoryId && typeof categoryId === 'string') {
        parts = await this.listParts.executeByCategory(categoryId);
      } else if (supplierId && typeof supplierId === 'string') {
        parts = await this.listParts.executeBySupplier(supplierId);
      } else if (tenantId && typeof tenantId === 'string') {
        parts = await this.listParts.execute(tenantId);
      } else {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      res.json(
        parts.map(part => ({
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
        }))
      );
    } catch (error) {
      Logger.error('List parts error:', error);
      res.status(500).json({ error: 'Failed to list parts' });
    }
  }

  // Batch create parts - much faster for bulk inserts
  async createMany(req: Request, res: Response): Promise<void> {
    try {
      const { parts } = req.body;
      
      if (!Array.isArray(parts) || parts.length === 0) {
        res.status(400).json({ error: 'Parts array is required' });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const created = [];
        for (const part of parts) {
          const p = await tx.part.create({
            data: {
              tenantId: part.tenantId,
              partNumber: part.partNumber || `PART-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: part.name,
              nameAr: part.nameAr || part.name,
              nameEn: part.nameEn || part.name,
              description: part.description || '',
              costSYP: part.costSYP || 0,
              costUSD: part.costUSD || 0,
              sellingPriceSYP: part.sellingPriceSYP || 0,
              sellingPriceUSD: part.sellingPriceUSD || 0,
              quantity: part.quantity || 0,
              minQuantity: part.minQuantity || 0,
              location: part.location || '',
              categoryId: part.categoryId,
              supplierId: part.supplierId,
              isActive: part.isActive !== undefined ? part.isActive : true,
            },
          });
          created.push(p);
        }
        return created;
      }, {
        timeout: 30000,
      });

      res.status(201).json({
        count: result.length,
        parts: result,
      });
    } catch (error) {
      Logger.error('Batch create parts error:', error);
      res.status(500).json({ error: 'Failed to create parts' });
    }
  }
}
