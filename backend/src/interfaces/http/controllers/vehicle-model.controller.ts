import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { PrismaVehicleModelRepository } from '../../../infrastructure/vehicles/repositories/PrismaVehicleModelRepository';

export class VehicleModelController {
  private modelRepository: PrismaVehicleModelRepository;

  constructor() {
    this.modelRepository = new PrismaVehicleModelRepository();
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const models = await this.modelRepository.findAll();
      res.json(models);
    } catch (error) {
      Logger.error('List vehicle models error:', error);
      res.status(500).json({ error: 'Failed to list vehicle models' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const model = await this.modelRepository.findById(id);

      if (!model) {
        res.status(404).json({ error: 'Vehicle model not found' });
        return;
      }

      res.json(model);
    } catch (error) {
      Logger.error('Get vehicle model error:', error);
      res.status(500).json({ error: 'Failed to get vehicle model' });
    }
  }

  async listByBrand(req: Request, res: Response): Promise<void> {
    try {
      const { brandId } = req.params;
      const models = await this.modelRepository.findByBrandId(brandId);
      res.json(models);
    } catch (error) {
      Logger.error('List vehicle models by brand error:', error);
      res.status(500).json({ error: 'Failed to list vehicle models by brand' });
    }
  }
}
