import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { PrismaVehicleBrandRepository } from '../../../infrastructure/vehicles/repositories/PrismaVehicleBrandRepository';

export class VehicleBrandController {
  private brandRepository: PrismaVehicleBrandRepository;

  constructor() {
    this.brandRepository = new PrismaVehicleBrandRepository();
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const brands = await this.brandRepository.findAll();
      res.json(brands);
    } catch (error) {
      Logger.error('List vehicle brands error:', error);
      res.status(500).json({ error: 'Failed to list vehicle brands' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const brand = await this.brandRepository.findById(id);

      if (!brand) {
        res.status(404).json({ error: 'Vehicle brand not found' });
        return;
      }

      res.json(brand);
    } catch (error) {
      Logger.error('Get vehicle brand error:', error);
      res.status(500).json({ error: 'Failed to get vehicle brand' });
    }
  }
}
