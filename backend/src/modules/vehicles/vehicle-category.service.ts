import prisma from '../../config/database';

export class VehicleCategoryService {
  async getAllCategories(tenantId: string) {
    const categories = await prisma.vehicleCategory.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { vehicles: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return categories.map((cat) => ({
      ...cat,
      vehicleCount: cat._count.vehicles,
    }));
  }

  async getCategoryById(id: string, tenantId: string) {
    return prisma.vehicleCategory.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { vehicles: true },
        },
      },
    });
  }

  async createCategory(data: {
    tenantId: string;
    name: string;
    nameAr: string;
    nameEn?: string;
    description?: string;
    isActive?: boolean;
  }) {
    return prisma.vehicleCategory.create({
      data,
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
    return prisma.vehicleCategory.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async deleteCategory(id: string, tenantId: string) {
    // Check if category has vehicles
    const category = await prisma.vehicleCategory.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { vehicles: true } } },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (category._count.vehicles > 0) {
      throw new Error('Cannot delete category with vehicles');
    }

    return prisma.vehicleCategory.delete({
      where: { id },
    });
  }
}
