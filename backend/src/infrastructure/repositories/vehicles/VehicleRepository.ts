import { IVehicleRepository } from '../../../application/vehicles/interfaces/IVehicleRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class VehicleRepository implements IVehicleRepository {
  async findByPlate(plateNumber: string, tenantId: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          licensePlate: plateNumber,
          tenantId,
        },
      });
      return vehicle;
    } catch (error) {
      throw new DatabaseError('Failed to find vehicle by plate', error);
    }
  }

  async findById(id: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
      });
      return vehicle;
    } catch (error) {
      throw new DatabaseError('Failed to find vehicle by id', error);
    }
  }

  async save(vehicle: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      const created = await prisma.vehicle.create({
        data: {
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
          notes: vehicle.notes,
          color: vehicle.color,
        },
      });
      return created;
    } catch (error) {
      throw new DatabaseError('Failed to save vehicle', error);
    }
  }

  async update(vehicle: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      const updated = await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          vin: vehicle.vin,
          currentKm: vehicle.currentKm,
          notes: vehicle.notes,
          color: vehicle.color,
        },
      });
      return updated;
    } catch (error) {
      throw new DatabaseError('Failed to update vehicle', error);
    }
  }

  async listByCustomer(customerId: string): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const vehicles = await prisma.vehicle.findMany({
        where: { customerId },
      });
      return vehicles;
    } catch (error) {
      throw new DatabaseError('Failed to list vehicles by customer', error);
    }
  }

  async listAll(tenantId: string): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const vehicles = await prisma.vehicle.findMany({
        where: { tenantId },
      });
      return vehicles;
    } catch (error) {
      throw new DatabaseError('Failed to list all vehicles', error);
    }
  }
}
