import { CustomerVehicleRepository } from '../../../application/customers/interfaces/CustomerVehicleRepository';
import { CustomerVehicle } from '../../../domain/customers/entities/CustomerVehicle';
import { PlateNumber } from '../../../domain/customers/value-objects/PlateNumber';
import prisma from '../../../config/database';

export class PrismaCustomerVehicleRepository implements CustomerVehicleRepository {
  async findById(id: string): Promise<CustomerVehicle | null> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return null;
    }

    return this.mapToDomain(vehicle);
  }

  async findByCustomerId(customerId: string): Promise<CustomerVehicle[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { customerId },
    });

    return vehicles.map(v => this.mapToDomain(v));
  }

  async findByPublicCarId(publicCarId: string): Promise<CustomerVehicle | null> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { publicCarId },
    });

    if (!vehicle) {
      return null;
    }

    return this.mapToDomain(vehicle);
  }

  async findByPlateNumber(plateNumber: PlateNumber, tenantId: string): Promise<CustomerVehicle | null> {
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

  async create(vehicle: CustomerVehicle): Promise<CustomerVehicle> {
    const createdVehicle = await prisma.vehicle.create({
      data: {
        id: vehicle.id,
        tenantId: vehicle.tenantId,
        customerId: vehicle.customerId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.plateNumber.getValue(),
        vin: vehicle.vin,
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

  async update(vehicle: CustomerVehicle): Promise<CustomerVehicle> {
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.plateNumber.getValue(),
        vin: vehicle.vin,
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

  private mapToDomain(prismaVehicle: any): CustomerVehicle {
    const plateNumber = new PlateNumber(prismaVehicle.licensePlate);

    return new CustomerVehicle(
      prismaVehicle.id,
      prismaVehicle.customerId,
      prismaVehicle.tenantId,
      plateNumber,
      prismaVehicle.make,
      prismaVehicle.model,
      prismaVehicle.year,
      prismaVehicle.publicCarId,
      prismaVehicle.vin,
      prismaVehicle.currentKm,
      prismaVehicle.color,
      prismaVehicle.notes,
      prismaVehicle.createdAt,
      prismaVehicle.updatedAt
    );
  }
}
