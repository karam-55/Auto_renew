import prisma from '../../config/database';
import { Logger } from '../../infrastructure/logging/logger';

export interface CreateWorkOrderDto {
  tenantId: string;
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: Date;
  bookingId?: string;
  assignedTo?: string;
}

export interface UpdateWorkOrderDto {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: Date;
  assignedTo?: string;
}

export interface WorkOrderFilters {
  status?: string;
  priority?: string;
  bookingId?: string;
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class WorkOrderService {
  async getAllWorkOrders(tenantId: string, filters: WorkOrderFilters = {}) {
    const { status, priority, bookingId, assignedTo, search, page = 1, limit = 20 } = filters;

    const where: any = { tenantId, deletedAt: null };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (bookingId) where.bookingId = bookingId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          Booking: {
            include: {
              customer: { select: { id: true, fullName: true, phone: true } },
              vehicle: { select: { id: true, make: true, model: true, licensePlate: true } },
            },
          },
          assignments: {
            include: {
              User: { select: { id: true, fullName: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: data.map(this.mapToWorkOrder),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getWorkOrderById(tenantId: string, id: string) {
    const task = await prisma.task.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        Booking: {
          include: {
            customer: { select: { id: true, fullName: true, phone: true } },
            vehicle: { select: { id: true, make: true, model: true, licensePlate: true } },
          },
        },
        assignments: {
          include: {
            User: { select: { id: true, fullName: true, phone: true } },
          },
        },
      },
    });

    if (!task) throw new Error('Work order not found');
    return this.mapToWorkOrder(task);
  }

  async createWorkOrder(tenantId: string, data: CreateWorkOrderDto) {
    const { assignedTo, ...taskData } = data;

    const task = await prisma.task.create({
      data: {
        ...taskData,
        priority: (taskData.priority || 'MEDIUM') as any,
        status: (taskData.status || 'PENDING') as any,
      },
      include: {
        Booking: {
          include: {
            customer: { select: { id: true, fullName: true, phone: true } },
            vehicle: { select: { id: true, make: true, model: true, licensePlate: true } },
          },
        },
        assignments: {
          include: {
            User: { select: { id: true, fullName: true, phone: true } },
          },
        },
      },
    });

    if (assignedTo) {
      await prisma.taskAssignment.create({
        data: { taskId: task.id, userId: assignedTo },
      });
    }

    return this.mapToWorkOrder(task);
  }

  async updateWorkOrder(tenantId: string, id: string, data: UpdateWorkOrderDto) {
    const existing = await prisma.task.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new Error('Work order not found');

    const { assignedTo, ...updateData } = data;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateData.priority && { priority: updateData.priority as any }),
        ...(updateData.status && { status: updateData.status as any }),
      },
      include: {
        Booking: {
          include: {
            customer: { select: { id: true, fullName: true, phone: true } },
            vehicle: { select: { id: true, make: true, model: true, licensePlate: true } },
          },
        },
        assignments: {
          include: {
            User: { select: { id: true, fullName: true, phone: true } },
          },
        },
      },
    });

    if (assignedTo) {
      await prisma.taskAssignment.create({
        data: { taskId: task.id, userId: assignedTo },
      });
    }

    return this.getWorkOrderById(tenantId, task.id);
  }

  async deleteWorkOrder(tenantId: string, id: string) {
    const existing = await prisma.task.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new Error('Work order not found');

    await prisma.task.delete({
      where: { id },
    });

    return { success: true };
  }

  async getWorkOrderStats(tenantId: string) {
    const [
      total,
      pending,
      inProgress,
      completed,
      overdue,
    ] = await Promise.all([
      prisma.task.count({ where: { tenantId, deletedAt: null } }),
      prisma.task.count({ where: { tenantId, deletedAt: null, status: 'PENDING' } }),
      prisma.task.count({ where: { tenantId, deletedAt: null, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { tenantId, deletedAt: null, status: 'COMPLETED' } }),
      prisma.task.count({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return { total, pending, inProgress, completed, overdue };
  }

  private mapToWorkOrder(task: any) {
    return {
      id: task.id,
      tenantId: task.tenantId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      bookingId: task.bookingId,
      booking: task.Booking
        ? {
            id: task.Booking.id,
            customer: task.Booking.customer,
            vehicle: task.Booking.vehicle,
          }
        : null,
      assignedTo: task.assignments?.[0]?.User || null,
      assignedAt: task.assignments?.[0]?.assignedAt || null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}

export default new WorkOrderService();
