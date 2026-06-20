import { IServiceRepository } from '../../../application/bookings/interfaces/IServiceRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class ServiceRepository implements IServiceRepository {
  async findById(id: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const service = await prisma.service.findUnique({
        where: { id },
      });
      return service;
    } catch (error) {
      throw new DatabaseError('Failed to find service by id', error);
    }
  }
}
