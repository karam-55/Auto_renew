import prisma from '../../config/database';
import { CreateMechanicAssignmentInput, UpdateMechanicAssignmentInput, MechanicAssignmentResponse } from './types';

export class MechanicAssignmentService {
  private io: any;

  constructor(io?: any) {
    this.io = io;
  }

  async getAllMechanicAssignments(tenantId?: string, filters?: {
    bookingId?: string;
    mechanicUserId?: string;
  }): Promise<MechanicAssignmentResponse[]> {
    const where: any = {};

    if (filters?.bookingId) {
      where.bookingId = filters.bookingId;
    }
    if (filters?.mechanicUserId) {
      where.mechanicUserId = filters.mechanicUserId;
    }

    const assignments = await prisma.mechanicAssignment.findMany({
      where,
      include: {
        booking: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        },
        mechanic: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return assignments;
  }

  async getMechanicAssignmentById(assignmentId: string): Promise<MechanicAssignmentResponse | null> {
    const assignment = await prisma.mechanicAssignment.findFirst({
      where: { id: assignmentId },
      include: {
        booking: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        },
        mechanic: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    return assignment;
  }

  async getAssignmentsByMechanic(mechanicUserId: string): Promise<MechanicAssignmentResponse[]> {
    return this.getAllMechanicAssignments(undefined, { mechanicUserId });
  }

  async getAssignmentsByBooking(bookingId: string): Promise<MechanicAssignmentResponse[]> {
    return this.getAllMechanicAssignments(undefined, { bookingId });
  }

  async createMechanicAssignment(tenantId: string, data: CreateMechanicAssignmentInput): Promise<MechanicAssignmentResponse> {
    // Verify booking exists and belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id: data.bookingId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Verify mechanic exists and belongs to tenant
    const mechanic = await prisma.user.findFirst({
      where: { id: data.mechanicUserId, tenantId, role: 'MECHANIC', isActive: true },
    });

    if (!mechanic) {
      throw new Error('Mechanic not found or inactive');
    }

    // Check if mechanic is already assigned to this booking
    const existingAssignment = await prisma.mechanicAssignment.findFirst({
      where: {
        bookingId: data.bookingId,
        mechanicUserId: data.mechanicUserId,
      },
    });

    if (existingAssignment) {
      throw new Error('Mechanic is already assigned to this booking');
    }

    const assignment = await prisma.mechanicAssignment.create({
      data: {
        bookingId: data.bookingId,
        mechanicUserId: data.mechanicUserId,
        assignedAt: data.assignedAt || new Date(),
        notes: data.notes,
      },
      include: {
        booking: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        },
        mechanic: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    // Emit Socket.io notification to the mechanic
    if (this.io) {
      this.io.to(`user:${data.mechanicUserId}`).emit('mechanic:assignment-created', {
        assignmentId: assignment.id,
        bookingId: assignment.bookingId,
        customerName: assignment.booking.customer?.fullName,
        vehicleInfo: assignment.booking.vehicle
          ? `${assignment.booking.vehicle.make} ${assignment.booking.vehicle.model} (${assignment.booking.vehicle.licensePlate})`
          : 'N/A',
        scheduledDate: assignment.booking.scheduledDate,
        status: assignment.booking.status,
      });

      // Also notify tenant channel
      this.io.to(`tenant:${tenantId}`).emit('mechanic:assignment-created', {
        assignmentId: assignment.id,
        mechanicName: assignment.mechanic.fullName,
        bookingId: assignment.bookingId,
      });
    }

    return assignment;
  }

  async updateMechanicAssignment(assignmentId: string, data: UpdateMechanicAssignmentInput): Promise<MechanicAssignmentResponse> {
    // Check if assignment exists
    const existingAssignment = await prisma.mechanicAssignment.findFirst({
      where: { id: assignmentId },
    });

    if (!existingAssignment) {
      throw new Error('Assignment not found');
    }

    // Validate status transitions
    if (data.status && data.status !== existingAssignment.status) {
      const validTransitions: Record<string, string[]> = {
        ASSIGNED: ['IN_PROGRESS', 'WAITING_PARTS'],
        IN_PROGRESS: ['WAITING_PARTS', 'READY'],
        WAITING_PARTS: ['IN_PROGRESS', 'READY'],
        READY: ['DELIVERED'],
        DELIVERED: [],
      };

      const allowed = validTransitions[existingAssignment.status] || [];
      if (!allowed.includes(data.status)) {
        throw new Error(`Invalid status transition from ${existingAssignment.status} to ${data.status}`);
      }
    }

    // If updating mechanic, verify new mechanic exists
    if (data.mechanicUserId && data.mechanicUserId !== existingAssignment.mechanicUserId) {
      const mechanic = await prisma.user.findFirst({
        where: { id: data.mechanicUserId, role: 'MECHANIC', isActive: true },
      });

      if (!mechanic) {
        throw new Error('Mechanic not found or inactive');
      }

      // Check if new mechanic is already assigned to this booking
      const duplicateAssignment = await prisma.mechanicAssignment.findFirst({
        where: {
          bookingId: existingAssignment.bookingId,
          mechanicUserId: data.mechanicUserId,
          id: { not: assignmentId },
        },
      });

      if (duplicateAssignment) {
        throw new Error('Mechanic is already assigned to this booking');
      }
    }

    const assignment = await prisma.mechanicAssignment.update({
      where: { id: assignmentId },
      data: {
        mechanicUserId: data.mechanicUserId,
        status: data.status as any,
        notes: data.notes,
      },
      include: {
        booking: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        },
        mechanic: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    // Emit Socket.io notification
    if (this.io && data.mechanicUserId && data.mechanicUserId !== existingAssignment.mechanicUserId) {
      // Notify old mechanic
      this.io.to(`user:${existingAssignment.mechanicUserId}`).emit('mechanic:assignment-removed', {
        assignmentId: assignment.id,
        bookingId: assignment.bookingId,
      });

      // Notify new mechanic
      this.io.to(`user:${data.mechanicUserId}`).emit('mechanic:assignment-created', {
        assignmentId: assignment.id,
        bookingId: assignment.bookingId,
        customerName: assignment.booking.customer?.fullName,
        vehicleInfo: assignment.booking.vehicle
          ? `${assignment.booking.vehicle.make} ${assignment.booking.vehicle.model} (${assignment.booking.vehicle.licensePlate})`
          : 'N/A',
        scheduledDate: assignment.booking.scheduledDate,
        status: assignment.booking.status,
      });
    }

    return assignment;
  }

  async deleteMechanicAssignment(assignmentId: string): Promise<void> {
    const assignment = await prisma.mechanicAssignment.findFirst({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    await prisma.mechanicAssignment.delete({
      where: { id: assignmentId },
    });

    // Emit Socket.io notification
    if (this.io) {
      this.io.to(`user:${assignment.mechanicUserId}`).emit('mechanic:assignment-removed', {
        assignmentId: assignment.id,
        bookingId: assignment.bookingId,
      });
    }
  }

  async updateAssignmentStatus(assignmentId: string, status: string): Promise<MechanicAssignmentResponse> {
    return this.updateMechanicAssignment(assignmentId, { status });
  }
}
