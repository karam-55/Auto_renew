import { Request, Response } from 'express';
import { ServiceService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';
import { getPaginationParams, createPaginatedResponse } from '../../shared/utils/pagination';
import prisma from '../../config/database';

export class ServiceController {
  private serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  getAllServices = async (req: AuthRequest, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const { page, limit, skip } = getPaginationParams(req);
      const [services, total] = await Promise.all([
        this.serviceService.getAllServices(req.user!.tenantId, includeInactive, skip, limit),
        this.serviceService.getServicesCount(req.user!.tenantId, includeInactive),
      ]);
      res.json(createPaginatedResponse(services, total, page, limit));
    } catch (error) {
      Logger.error('Get all services error', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  };

  getServiceById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const service = await this.serviceService.getServiceById(req.user!.tenantId, id);

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json({ service });
    } catch (error) {
      Logger.error('Get service error:', error);
      res.status(500).json({ error: 'Failed to fetch service' });
    }
  };

  getServicesByCategory = async (req: AuthRequest, res: Response) => {
    try {
      const { category } = req.params;
      const services = await this.serviceService.getServicesByCategory(req.user!.tenantId, category);
      res.json({ services });
    } catch (error) {
      Logger.error('Get services by category error:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  };

  searchServices = async (req: AuthRequest, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
      }

      const services = await this.serviceService.searchServices(req.user!.tenantId, q);
      res.json({ services });
    } catch (error) {
      Logger.error('Search services error:', error);
      res.status(500).json({ error: 'Failed to search services' });
    }
  };

  createService = async (req: AuthRequest, res: Response) => {
    try {
      const service = await this.serviceService.createService(req.user!.tenantId, req.body);
      res.status(201).json({ service });
    } catch (error: any) {
      Logger.error('Create service error:', error);
      res.status(400).json({ error: error.message || 'Failed to create service' });
    }
  };

  updateService = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const service = await this.serviceService.updateService(req.user!.tenantId, id, req.body);
      res.json({ service });
    } catch (error: any) {
      Logger.error('Update service error:', error);
      res.status(400).json({ error: error.message || 'Failed to update service' });
    }
  };

  deleteService = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.serviceService.deleteService(req.user!.tenantId, id);
      res.json({ message: 'Service deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete service error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete service' });
    }
  };

  // Service Parts endpoints
  getServiceParts = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const parts = await this.serviceService.getServiceParts(req.user!.tenantId, id);
      res.json({ parts });
    } catch (error: any) {
      Logger.error('Get service parts error:', error);
      res.status(400).json({ error: error.message || 'Failed to fetch service parts' });
    }
  };

  addServicePart = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { partId, quantity } = req.body;
      
      if (!partId || !quantity) {
        return res.status(400).json({ error: 'partId and quantity are required' });
      }

      const servicePart = await this.serviceService.addServicePart(
        req.user!.tenantId,
        id,
        partId,
        quantity
      );
      res.status(201).json({ servicePart });
    } catch (error: any) {
      Logger.error('Add service part error:', error);
      res.status(400).json({ error: error.message || 'Failed to add service part' });
    }
  };

  removeServicePart = async (req: AuthRequest, res: Response) => {
    try {
      const { id, partId } = req.params;
      await this.serviceService.removeServicePart(req.user!.tenantId, id, partId);
      res.json({ message: 'Service part removed successfully' });
    } catch (error: any) {
      Logger.error('Remove service part error:', error);
      res.status(400).json({ error: error.message || 'Failed to remove service part' });
    }
  };

  // Batch create services
  createMany = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { services } = req.body;

      if (!Array.isArray(services) || services.length === 0) {
        res.status(400).json({ error: 'Services array is required' });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const created = [];
        for (const svc of services) {
          const s = await tx.service.create({
            data: {
              tenantId,
              name: svc.name,
              nameAr: svc.nameAr || svc.name,
              nameEn: svc.nameEn || svc.name,
              description: svc.description || '',
              priceSYP: svc.priceSYP || 0,
              priceUSD: svc.priceUSD || 0,
              categoryId: svc.categoryId,
              duration: svc.duration || 60,
              isActive: svc.isActive !== undefined ? svc.isActive : true,
            },
          });
          created.push(s);
        }
        return created;
      }, {
        timeout: 30000,
      });

      res.status(201).json({ count: result.length, services: result });
    } catch (error: any) {
      Logger.error('Batch create services error:', error);
      res.status(400).json({ error: error.message || 'Failed to create services' });
    }
  };
}
