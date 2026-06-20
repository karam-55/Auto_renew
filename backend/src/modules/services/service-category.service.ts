import prisma from '../../config/database';

export class ServiceCategoryService {
  async getAllCategories(tenantId: string) {
    const categories = await prisma.serviceCategory.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { services: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return categories.map((cat) => ({
      ...cat,
      serviceCount: cat._count.services,
    }));
  }

  async getCategoryById(id: string, tenantId: string) {
    return prisma.serviceCategory.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });
  }

  async createCategory(data: {
    tenantId: string;
    name: string;
    nameAr?: string;
    nameEn?: string;
    description?: string;
  }) {
    return prisma.serviceCategory.create({
      data: {
        ...data,
        nameAr: data.nameAr || data.name,
      },
    });
  }

  async updateCategory(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      nameAr?: string;
      nameEn?: string;
      description?: string;
      isActive?: boolean;
    }
  ) {
    return prisma.serviceCategory.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async deleteCategory(id: string, tenantId: string) {
    // Check if category has services
    const category = await prisma.serviceCategory.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { services: true } } },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (category._count.services > 0) {
      throw new Error('Cannot delete category with services');
    }

    return prisma.serviceCategory.delete({
      where: { id },
    });
  }
}
