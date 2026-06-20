import { VehicleRepository } from '../../../application/vehicles/interfaces/VehicleRepository';
import { Vehicle } from '../../../domain/vehicles/entities/Vehicle';
import { PlateNumber } from '../../../domain/vehicles/value-objects/PlateNumber';
import { VIN } from '../../../domain/vehicles/value-objects/VIN';
import prisma from '../../../config/database';

export class PrismaVehicleRepository implements VehicleRepository {
  async findById(id: string): Promise<Vehicle | null> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return null;
    }

    return this.mapToDomain(vehicle);
  }

  async findByPublicCarId(publicCarId: string): Promise<Vehicle | null> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { publicCarId },
    });

    if (!vehicle) {
      return null;
    }

    return this.mapToDomain(vehicle);
  }

  async findByPlateNumber(plateNumber: PlateNumber, tenantId: string): Promise<Vehicle | null> {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        tenantId,
        licensePlate: plateNumber.getValue(),
      },
    });

    if (!vehicle) {
      return null;
    }

    return this.mapToDomain(vehicle);
  }

  async findByCustomerId(customerId: string): Promise<Vehicle[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { customerId },
    });

    return vehicles.map(v => this.mapToDomain(v));
  }

  async findByTenantId(tenantId: string): Promise<Vehicle[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId },
    });

    return vehicles.map(v => this.mapToDomain(v));
  }

  async create(vehicle: Vehicle): Promise<Vehicle> {
    const createdVehicle = await prisma.vehicle.create({
      data: {
        id: vehicle.id,
        tenantId: vehicle.tenantId,
        customerId: vehicle.customerId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.plateNumber.getValue(),
        vin: vehicle.vin?.getValue(),
        publicCarId: vehicle.publicCarId,
        currentKm: vehicle.currentKm,
        color: vehicle.color,
        notes: vehicle.notes,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      },
    });

    return this.mapToDomain(createdVehicle);
  }

  async update(vehicle: Vehicle): Promise<Vehicle> {
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        customerId: vehicle.customerId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.plateNumber.getValue(),
        vin: vehicle.vin?.getValue(),
        currentKm: vehicle.currentKm,
        color: vehicle.color,
        notes: vehicle.notes,
        updatedAt: vehicle.updatedAt,
      },
    });

    return this.mapToDomain(updatedVehicle);
  }

  async delete(id: string): Promise<void> {
    await prisma.vehicle.delete({
      where: { id },
    });
  }

  async assignCustomer(vehicleId: string, customerId: string): Promise<void> {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { customerId },
    });
  }

  private mapToDomain(prismaVehicle: any): Vehicle {
    const plateNumber = new PlateNumber(prismaVehicle.licensePlate);
    const vin = prismaVehicle.vin ? new VIN(prismaVehicle.vin) : undefined;

    return new Vehicle(
      prismaVehicle.id,
      prismaVehicle.customerId,
      prismaVehicle.tenantId,
      plateNumber,
      prismaVehicle.make,
      prismaVehicle.model,
      prismaVehicle.year,
      prismaVehicle.publicCarId,
      vin,
      prismaVehicle.currentKm,
      prismaVehicle.color,
      prismaVehicle.notes,
      prismaVehicle.createdAt,
      prismaVehicle.updatedAt
    );
  }
}
