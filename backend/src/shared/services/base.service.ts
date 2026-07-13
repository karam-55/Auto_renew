import { PrismaClient } from '@prisma/client';
import prisma from '../../config/database';
import { Logger } from '../../infrastructure/logging/logger';

/**
 * Base Service Class
 * Provides common CRUD operations with tenant isolation.
 * All entity services should extend this class.
 *
 * @template T - The Prisma model type
 */
export abstract class BaseService<T extends string> {
  protected prisma: PrismaClient;
  protected modelName: T;
  protected logger: typeof Logger;

  constructor(modelName: T) {
    this.prisma = prisma;
    this.modelName = modelName;
    this.logger = Logger;
  }

  /**
   * Get the Prisma delegate for the model
   */
  protected getModel() {
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Find a record by ID with tenant isolation
   */
  async findById(tenantId: string, id: string, include?: any): Promise<any | null> {
    const model = this.getModel();
    const record = await model.findFirst({
      where: { id, tenantId },
      include,
    });
    return record;
  }

  /**
   * Find many records with tenant isolation and pagination
   */
  async findMany(
    tenantId: string,
    options: {
      skip?: number;
      take?: number;
      orderBy?: any;
      where?: any;
      include?: any;
    } = {}
  ): Promise<any[]> {
    const model = this.getModel();
    return await model.findMany({
      where: { tenantId, ...options.where },
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      include: options.include,
    });
  }

  /**
   * Count records with tenant isolation
   */
  async count(tenantId: string, where?: any): Promise<number> {
    const model = this.getModel();
    return await model.count({
      where: { tenantId, ...where },
    });
  }

  /**
   * Create a record with tenantId auto-set
   */
  async create(tenantId: string, data: any, include?: any): Promise<any> {
    const model = this.getModel();
    return await model.create({
      data: { ...data, tenantId },
      include,
    });
  }

  /**
   * Update a record with tenant isolation check
   */
  async update(tenantId: string, id: string, data: any, include?: any): Promise<any | null> {
    const model = this.getModel();
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      return null;
    }
    return await model.update({
      where: { id },
      data,
      include,
    });
  }

  /**
   * Delete a record permanently
   */
  async delete(tenantId: string, id: string): Promise<boolean> {
    const model = this.getModel();
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      return false;
    }
    await model.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Hard delete a record (use with caution)
   * @deprecated Use delete() instead. Hard delete is now the default behavior.
   */
  async hardDelete(tenantId: string, id: string): Promise<boolean> {
    return this.delete(tenantId, id);
  }

  /**
   * Check if a record exists for this tenant
   */
  async exists(tenantId: string, id: string): Promise<boolean> {
    const model = this.getModel();
    const count = await model.count({
      where: { id, tenantId },
    });
    return count > 0;
  }

  /**
   * Search records by a field value
   */
  async search(
    tenantId: string,
    field: string,
    value: string,
    options: { limit?: number; include?: any } = {}
  ): Promise<any[]> {
    const model = this.getModel();
    return await model.findMany({
      where: {
        tenantId,
        [field]: { contains: value, mode: 'insensitive' },
      },
      take: options.limit || 20,
      include: options.include,
    });
  }
}
