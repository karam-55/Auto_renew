import prisma from '../../config/database';

export class MaintenancePackageService {
  async getAllPackages(tenantId: string) {
    return prisma.maintenancePackage.findMany({
      where: { tenantId },
      include: {
        items: {
          include: {
            part: true,
            service: true,
          },
        },
        template: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPackageById(id: string, tenantId: string) {
    return prisma.maintenancePackage.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            part: true,
            service: true,
          },
        },
        template: true,
      },
    });
  }

  async createPackage(data: {
    tenantId: string;
    templateId: string;
    name: string;
    nameAr?: string;
    nameEn?: string;
    description?: string;
    totalSYP: number;
    totalUSD?: number;
    items: Array<{
      partId?: string;
      serviceId?: string;
      quantity: number;
      priceSYP: number;
      priceUSD?: number;
    }>;
  }) {
    const { items, ...packageData } = data;

    return prisma.maintenancePackage.create({
      data: {
        ...packageData,
        items: {
          create: items.map((item) => ({ ...item, tenantId: packageData.tenantId })),
        },
      },
      include: {
        items: {
          include: {
            part: true,
            service: true,
          },
        },
        template: true,
      },
    });
  }

  async updatePackage(
    id: string,
    tenantId: string,
    data: {
      templateId?: string;
      name?: string;
      nameAr?: string;
      nameEn?: string;
      description?: string;
      totalSYP?: number;
      totalUSD?: number;
      isActive?: boolean;
      items?: Array<{
        id?: string;
        partId?: string;
        serviceId?: string;
        quantity: number;
        priceSYP: number;
        priceUSD?: number;
      }>;
    }
  ) {
    const { items, ...packageData } = data;

    // Update package
    const packageUpdate = prisma.maintenancePackage.update({
      where: { id },
      data: packageData,
    });

    // Update items if provided
    let itemsUpdate;
    if (items) {
      // Delete existing items
      await prisma.maintenancePackageItem.deleteMany({
        where: { packageId: id },
      });

      // Create new items
      itemsUpdate = prisma.maintenancePackageItem.createMany({
        data: items.map((item) => ({
          ...item,
          tenantId,
          packageId: id,
        })),
      });
    }

    await packageUpdate;
    if (itemsUpdate) await itemsUpdate;

    return this.getPackageById(id, tenantId);
  }

  async deletePackage(id: string, tenantId: string) {
    return prisma.maintenancePackage.deleteMany({
      where: { id, tenantId },
    });
  }
}
