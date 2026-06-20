import { PrismaClient } from '@prisma/client';
import { Logger } from '../../infrastructure/logging/logger';

const prisma = new PrismaClient();

export class DealerService {
  async createDealer(tenantId: string, data: any) {
    return prisma.dealer.create({
      data: { ...data, tenantId },
    });
  }

  async getDealers(tenantId: string, filters: any, skip: number, limit: number) {
    const where: any = { tenantId, deletedAt: null };
    if (filters?.status) where.status = filters.status;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.dealer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDealersCount(tenantId: string, filters: any) {
    const where: any = { tenantId, deletedAt: null };
    if (filters?.status) where.status = filters.status;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.dealer.count({ where });
  }

  async getDealerById(id: string, tenantId: string) {
    return prisma.dealer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async updateDealer(id: string, tenantId: string, data: any) {
    return prisma.dealer.updateMany({
      where: { id, tenantId },
      data,
    }).then(() => this.getDealerById(id, tenantId));
  }

  async deleteDealer(id: string, tenantId: string) {
    return prisma.dealer.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }

  async searchDealers(tenantId: string, query: string) {
    return prisma.dealer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }
}
