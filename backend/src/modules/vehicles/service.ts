import { randomBytes } from 'crypto';
import prisma from '../../config/database';
import { CreateVehicleInput, UpdateVehicleInput, VehicleResponse } from './types';

export class VehicleService {
  async getAllVehicles(tenantId: string, skip?: number, limit?: number): Promise<VehicleResponse[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: skip || undefined,
      take: limit || undefined,
    });

    return vehicles.map((vehicle) => this.mapToVehicleResponse(vehicle));
  }

  async getVehiclesCount(tenantId: string): Promise<number> {
    return prisma.vehicle.count({ where: { tenantId } });
  }

  async getVehicleById(tenantId: string, vehicleId: string): Promise<VehicleResponse | null> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            address: true,
            city: true,
            isVip: true,
            loyaltyPoints: true,
          },
        },
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'WAITING_PARTS', 'READY'],
            },
          },
          orderBy: {
            scheduledDate: 'asc',
          },
          take: 1,
        },
      },
    });

    if (!vehicle) {
      return null;
    }

    return this.mapToVehicleResponse(vehicle);
  }

  async getVehiclesByCustomer(tenantId: string, customerId: string): Promise<VehicleResponse[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId, customerId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map((vehicle) => this.mapToVehicleResponse(vehicle));
  }

  async searchVehicles(tenantId: string, query: string): Promise<VehicleResponse[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        tenantId,
        OR: [
          { licensePlate: { contains: query, mode: 'insensitive' } },
          { vin: { contains: query, mode: 'insensitive' } },
          { make: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map((vehicle) => this.mapToVehicleResponse(vehicle));
  }

  async createVehicle(tenantId: string, data: CreateVehicleInput): Promise<VehicleResponse> {
    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, tenantId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if license plate already exists in this tenant
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { tenantId, licensePlate: data.licensePlate },
    });

    if (existingVehicle) {
      throw new Error('Vehicle with this license plate already exists');
    }

    // Generate public car ID
    const publicCarId = `CAR-${Date.now()}-${randomBytes(5).toString('hex')}`;

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        customerId: data.customerId,
        make: data.make,
        model: data.model,
        year: data.year,
        licensePlate: data.licensePlate,
        vin: data.vin,
        color: data.color,
        currentKm: data.currentKm,
        publicCarId,
        notes: data.notes,
        categoryId: data.categoryId,
        // lastServiceDate will be set when first booking is completed
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    return this.mapToVehicleResponse(vehicle);
  }

  async updateVehicle(tenantId: string, vehicleId: string, data: UpdateVehicleInput): Promise<VehicleResponse> {
    // Check if vehicle exists and belongs to tenant
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId },
    });

    if (!existingVehicle) {
      throw new Error('Vehicle not found');
    }

    // If updating customer, verify new customer exists and belongs to tenant
    if (data.customerId && data.customerId !== existingVehicle.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, tenantId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }
    }

    // If updating license plate, check if new license plate is available
    if (data.licensePlate && data.licensePlate !== existingVehicle.licensePlate) {
      const licensePlateExists = await prisma.vehicle.findFirst({
        where: { tenantId, licensePlate: data.licensePlate },
      });

      if (licensePlateExists) {
        throw new Error('Vehicle with this license plate already exists');
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        customerId: data.customerId,
        make: data.make,
        model: data.model,
        year: data.year,
        licensePlate: data.licensePlate,
        vin: data.vin,
        color: data.color,
        currentKm: data.currentKm,
        notes: data.notes,
        categoryId: data.categoryId,
        lastServiceDate: data.lastServiceDate,
        nextServiceDate: data.nextServiceDate,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    return this.mapToVehicleResponse(vehicle);
  }

  async updateMileage(tenantId: string, vehicleId: string, currentKm: number): Promise<VehicleResponse> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { currentKm },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    return this.mapToVehicleResponse(updatedVehicle);
  }

  async deleteVehicle(tenantId: string, vehicleId: string): Promise<void> {
    // Check if vehicle exists and belongs to tenant
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId },
    });

    if (!existingVehicle) {
      throw new Error('Vehicle not found');
    }

    // Check if vehicle has ACTIVE bookings (PENDING, CONFIRMED, IN_PROGRESS, WAITING_PARTS, READY)
    const activeBookings = await prisma.booking.count({
      where: {
        vehicleId,
        tenantId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'WAITING_PARTS', 'READY'] },
      },
    });

    if (activeBookings > 0) {
      throw new Error('لا يمكن حذف المركبة لأنها مرتبطة بحجوزات نشطة. يجب حذف الحجز النشط أولاً');
    }

    // Soft delete completed/cancelled bookings for this vehicle
    await prisma.booking.deleteMany({
      where: {
        vehicleId,
        tenantId,
        status: { in: ['COMPLETED', 'CANCELLED'] },
      },
    });

    // Soft delete vehicle
    await prisma.vehicle.delete({
      where: { id: vehicleId },
    });
  }

  private mapToVehicleResponse(vehicle: any): VehicleResponse {
    return {
      id: vehicle.id,
      tenantId: vehicle.tenantId,
      customerId: vehicle.customerId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin,
      publicCarId: vehicle.publicCarId,
      currentKm: vehicle.currentKm,
      color: vehicle.color,
      notes: vehicle.notes,
      categoryId: vehicle.categoryId,
      lastServiceDate: vehicle.lastServiceDate,
      nextServiceDate: vehicle.nextServiceDate,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
      customer: vehicle.customer,
      category: vehicle.category,
      activeBooking: vehicle.bookings && vehicle.bookings.length > 0 ? {
        id: vehicle.bookings[0].id,
        status: vehicle.bookings[0].status,
        scheduledDate: vehicle.bookings[0].scheduledDate,
        scheduledTime: vehicle.bookings[0].scheduledTime,
        notes: vehicle.bookings[0].notes,
      } : undefined,
    };
  }

  async updateLastServiceDate(vehicleId: string, tenantId: string): Promise<void> {
    // Find the latest completed booking for this vehicle
    const latestCompletedBooking = await prisma.booking.findFirst({
      where: {
        vehicleId,
        tenantId,
        status: 'COMPLETED',
      },
      orderBy: {
        actualCompletionDate: 'desc',
      },
    });

    if (latestCompletedBooking && latestCompletedBooking.actualCompletionDate) {
      // Update vehicle's lastServiceDate to the completion date
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          lastServiceDate: latestCompletedBooking.actualCompletionDate,
        },
      });
    }
  }
}
