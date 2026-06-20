import { Branch, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { WhatsAppService } from '../../api/services/whatsapp.service';

export class BranchService {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  async getAllBranches(tenantId: string): Promise<Branch[]> {
    return prisma.branch.findMany({
      where: { tenantId },
      include: {
        warehouses: true,
        _count: {
          select: {
            bookings: true,
            invoices: true,
            employees: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBranchById(id: string, tenantId: string): Promise<Branch | null> {
    return prisma.branch.findFirst({
      where: { id, tenantId },
      include: {
        warehouses: true,
        employees: true,
      },
    });
  }

  async createBranch(data: Prisma.BranchCreateInput): Promise<Branch> {
    return prisma.branch.create({
      data,
      include: {
        warehouses: true,
      },
    });
  }

  async updateBranch(id: string, tenantId: string, data: Prisma.BranchUpdateInput): Promise<Branch> {
    return prisma.branch.update({
      where: { id, tenantId },
      data,
      include: {
        warehouses: true,
      },
    });
  }

  async deleteBranch(id: string, tenantId: string): Promise<Branch> {
    // Check if branch has bookings or invoices
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            invoices: true,
          },
        },
      },
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    if (branch._count.bookings > 0 || branch._count.invoices > 0) {
      throw new Error('Cannot delete branch with existing bookings or invoices');
    }

    return prisma.branch.delete({
      where: { id, tenantId },
    });
  }

  async activateBranch(id: string, tenantId: string): Promise<Branch> {
    return prisma.branch.update({
      where: { id, tenantId },
      data: { isActive: true },
    });
  }

  async deactivateBranch(id: string, tenantId: string): Promise<Branch> {
    return prisma.branch.update({
      where: { id, tenantId },
      data: { isActive: false },
    });
  }

  async getPrimaryWarehouse(branchId: string, tenantId: string) {
    return prisma.warehouse.findFirst({
      where: {
        branchId,
        tenantId,
        isPrimary: true,
        status: 'ACTIVE',
      },
    });
  }

  async setPrimaryWarehouse(warehouseId: string, tenantId: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: { branch: true },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Remove primary flag from all warehouses in the branch
    await prisma.warehouse.updateMany({
      where: {
        branchId: warehouse.branchId,
        tenantId,
      },
      data: { isPrimary: false },
    });

    // Set primary flag to the selected warehouse
    return prisma.warehouse.update({
      where: { id: warehouseId },
      data: { isPrimary: true },
    });
  }
}
