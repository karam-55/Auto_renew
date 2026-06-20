import { PrismaClient } from '@prisma/client';
import { Logger } from '../../infrastructure/logging/logger';

const prisma = new PrismaClient();

export class DocumentService {
  async createDocument(tenantId: string, data: any) {
    return prisma.document.create({
      data: { ...data, tenantId },
    });
  }

  async getDocuments(tenantId: string, filters: any, skip: number, limit: number) {
    const where: any = { tenantId, deletedAt: null };
    if (filters?.category) where.category = filters.category;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;

    return prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocumentsCount(tenantId: string, filters: any) {
    const where: any = { tenantId, deletedAt: null };
    if (filters?.category) where.category = filters.category;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;

    return prisma.document.count({ where });
  }

  async getDocumentById(id: string, tenantId: string) {
    return prisma.document.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async updateDocument(id: string, tenantId: string, data: any) {
    return prisma.document.updateMany({
      where: { id, tenantId },
      data,
    }).then(() => this.getDocumentById(id, tenantId));
  }

  async deleteDocument(id: string, tenantId: string) {
    return prisma.document.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }

  async getCategoryCounts(tenantId: string) {
    const counts = await prisma.document.groupBy({
      by: ['category'],
      where: { tenantId, deletedAt: null },
      _count: { category: true },
    });
    const result: Record<string, number> = {};
    counts.forEach(c => {
      result[c.category] = c._count.category;
    });
    return result;
  }
}
