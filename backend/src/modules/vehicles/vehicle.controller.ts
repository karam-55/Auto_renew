import { Request, Response } from 'express';
import { VehicleService } from './vehicle.service';
import { VehicleHistoryType, FaultSeverity, AttachmentType, RecommendationStatus } from '@prisma/client';
import { logAuditFromRequest } from '../../middleware/audit.middleware';
import { Logger } from '../../infrastructure/logging/logger';

export class VehicleController {
  private vehicleService: VehicleService;

  constructor() {
    this.vehicleService = new VehicleService();
  }

  // Get vehicle history
  async getVehicleHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const history = await this.vehicleService.getVehicleHistory(id);
      res.json({ success: true, data: history });
    } catch (error) {
      Logger.error('Get vehicle history error', error);
      res.status(500).json({ success: false, error: 'Failed to fetch vehicle history' });
    }
  }

  // Get vehicle faults
  async getVehicleFaults(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const faults = await this.vehicleService.getVehicleFaults(id);
      res.json({ success: true, data: faults });
    } catch (error) {
      Logger.error('Get vehicle faults error', error);
      res.status(500).json({ success: false, error: 'Failed to fetch vehicle faults' });
    }
  }

  // Create vehicle fault
  async createVehicleFault(req: Request, res: Response) {
    try {
      const { id: vehicleId } = req.params;
      const { title, description, severity } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      const prisma = require('../../config/database').default;
      const fault = await prisma.vehicleFault.create({
        data: {
          tenantId,
          vehicleId,
          title,
          description,
          severity: severity as FaultSeverity,
          status: 'OPEN',
        },
      });

      // Log audit
      logAuditFromRequest(req, 'VEHICLE_FAULT_CREATED', 'VehicleFault', fault.id, null, fault);

      // Add history entry
      await this.vehicleService.addHistoryEntry({
        tenantId,
        vehicleId,
        description: `Fault created: ${title}`,
        type: 'FAULT',
      });

      res.status(201).json({ success: true, data: fault });
    } catch (error) {
      Logger.error('Create vehicle fault error', error);
      res.status(500).json({ success: false, error: 'Failed to create vehicle fault' });
    }
  }

  // Resolve vehicle fault
  async resolveVehicleFault(req: Request, res: Response) {
    try {
      const { faultId } = req.params;
      const prisma = require('../../config/database').default;

      const oldFault = await prisma.vehicleFault.findUnique({ where: { id: faultId } });
      const fault = await prisma.vehicleFault.update({
        where: { id: faultId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });

      // Log audit
      logAuditFromRequest(req, 'VEHICLE_FAULT_RESOLVED', 'VehicleFault', fault.id, oldFault, fault);

      // Add history entry
      await this.vehicleService.addHistoryEntry({
        tenantId: fault.tenantId,
        vehicleId: fault.vehicleId,
        description: `Fault resolved: ${fault.title}`,
        type: 'FAULT',
      });

      res.json({ success: true, data: fault });
    } catch (error) {
      Logger.error('Resolve vehicle fault error', error);
      res.status(500).json({ success: false, error: 'Failed to resolve vehicle fault' });
    }
  }

  // Update vehicle fault
  async updateVehicleFault(req: Request, res: Response) {
    try {
      const { faultId } = req.params;
      const { title, description, severity } = req.body;
      const prisma = require('../../config/database').default;

      const oldFault = await prisma.vehicleFault.findUnique({ where: { id: faultId } });
      const fault = await prisma.vehicleFault.update({
        where: { id: faultId },
        data: {
          title: title || oldFault?.title,
          description: description !== undefined ? description : oldFault?.description,
          severity: severity || oldFault?.severity,
        },
      });

      // Log audit
      logAuditFromRequest(req, 'VEHICLE_FAULT_UPDATED', 'VehicleFault', faultId, oldFault, fault);

      // Add history entry
      await this.vehicleService.addHistoryEntry({
        tenantId: fault.tenantId,
        vehicleId: fault.vehicleId,
        description: `Fault updated: ${fault.title}`,
        type: 'FAULT',
      });

      res.json({ success: true, data: fault });
    } catch (error) {
      Logger.error('Update vehicle fault error:', error);
      res.status(500).json({ success: false, error: 'Failed to update vehicle fault' });
    }
  }

  // Delete vehicle fault
  async deleteVehicleFault(req: Request, res: Response) {
    try {
      const { faultId } = req.params;
      const prisma = require('../../config/database').default;

      const oldFault = await prisma.vehicleFault.findUnique({ where: { id: faultId } });
      await prisma.vehicleFault.delete({
        where: { id: faultId },
      });

      // Log audit
      logAuditFromRequest(req, 'VEHICLE_FAULT_DELETED', 'VehicleFault', faultId, oldFault, null);

      // Add history entry
      if (oldFault) {
        await this.vehicleService.addHistoryEntry({
          tenantId: oldFault.tenantId,
          vehicleId: oldFault.vehicleId,
          description: `Fault deleted: ${oldFault.title}`,
          type: 'FAULT',
        });
      }

      res.json({ success: true });
    } catch (error) {
      Logger.error('Delete vehicle fault error', error);
      res.status(500).json({ success: false, error: 'Failed to delete vehicle fault' });
    }
  }

  // Get vehicle attachments
  async getVehicleAttachments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const attachments = await this.vehicleService.getVehicleAttachments(id);
      res.json({ success: true, data: attachments });
    } catch (error) {
      Logger.error('Get vehicle attachments error', error);
      res.status(500).json({ success: false, error: 'Failed to fetch vehicle attachments' });
    }
  }

  // Create vehicle attachment
  async createVehicleAttachment(req: Request, res: Response) {
    try {
      const { id: vehicleId } = req.params;
      const { type, description, name } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      const prisma = require('../../config/database').default;

      // Handle file upload
      let fileUrl = '';
      if (req.file) {
        fileUrl = `/uploads/${req.file.filename}`;
      }

      const attachment = await prisma.vehicleAttachment.create({
        data: {
          tenantId,
          vehicleId,
          fileUrl,
          type: type as AttachmentType,
          name: name || description || type,
          description,
        },
      });

      // Add history entry
      await this.vehicleService.addHistoryEntry({
        tenantId,
        vehicleId,
        description: `Attachment added: ${name || description || type}`,
        type: 'PART_CONSUMPTION',
      });

      res.status(201).json({ success: true, data: attachment });
    } catch (error) {
      Logger.error('Create vehicle attachment error', error);
      res.status(500).json({ success: false, error: 'Failed to create vehicle attachment' });
    }
  }

  // Get vehicle recommendations
  async getVehicleRecommendations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const recommendations = await this.vehicleService.getVehicleRecommendations(id);
      res.json({ success: true, data: recommendations });
    } catch (error) {
      Logger.error('Get vehicle recommendations error', error);
      res.status(500).json({ success: false, error: 'Failed to fetch vehicle recommendations' });
    }
  }

  // Create vehicle recommendation
  async createVehicleRecommendation(req: Request, res: Response) {
    try {
      const { id: vehicleId } = req.params;
      const { title, description, dueMileage, dueDate } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      const prisma = require('../../config/database').default;
      const recommendation = await prisma.vehicleRecommendation.create({
        data: {
          tenantId,
          vehicleId,
          title,
          description,
          dueMileage,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'PENDING',
        },
      });

      // Add history entry
      await this.vehicleService.addHistoryEntry({
        tenantId,
        vehicleId,
        description: `Recommendation created: ${title}`,
        type: 'SERVICE',
      });

      res.status(201).json({ success: true, data: recommendation });
    } catch (error) {
      Logger.error('Create vehicle recommendation error', error);
      res.status(500).json({ success: false, error: 'Failed to create vehicle recommendation' });
    }
  }

  // Complete vehicle recommendation
  async completeVehicleRecommendation(req: Request, res: Response) {
    try {
      const { recId } = req.params;
      const prisma = require('../../config/database').default;

      const recommendation = await prisma.vehicleRecommendation.update({
        where: { id: recId },
        data: {
          status: 'DONE',
        },
      });

      // Add history entry
      await this.vehicleService.addHistoryEntry({
        tenantId: recommendation.tenantId,
        vehicleId: recommendation.vehicleId,
        description: `Recommendation completed: ${recommendation.title}`,
        type: 'NOTE',
      });

      res.json({ success: true, data: recommendation });
    } catch (error) {
      Logger.error('Complete vehicle recommendation error:', error);
      res.status(500).json({ success: false, error: 'Failed to complete vehicle recommendation' });
    }
  }

  // Update vehicle mileage
  async updateVehicleMileage(req: Request, res: Response) {
    try {
      const { id: vehicleId } = req.params;
      const { mileage } = req.body;
      const tenantId = req.headers['x-tenant-id'] as string;

      const vehicle = await this.vehicleService.updateMileage({
        tenantId,
        vehicleId,
        mileage,
      });

      // Add history entry
      await this.vehicleService.addHistoryEntry({
        tenantId,
        vehicleId,
        description: `Mileage updated to ${mileage} km`,
        type: 'NOTE',
      });

      res.json({ success: true, data: vehicle });
    } catch (error) {
      Logger.error('Update vehicle mileage error:', error);
      res.status(500).json({ success: false, error: 'Failed to update vehicle mileage' });
    }
  }

  // Update vehicle recommendation
  async updateVehicleRecommendation(req: Request, res: Response) {
    try {
      const { recId } = req.params;
      const { title, description, dueMileage, dueDate } = req.body;
      const prisma = require('../../config/database').default;

      const oldRecommendation = await prisma.vehicleRecommendation.findUnique({ where: { id: recId } });
      const recommendation = await prisma.vehicleRecommendation.update({
        where: { id: recId },
        data: {
          title: title || oldRecommendation?.title,
          description: description !== undefined ? description : oldRecommendation?.description,
          dueMileage: dueMileage !== undefined ? dueMileage : oldRecommendation?.dueMileage,
          dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : oldRecommendation?.dueDate,
        },
      });

      // Add history entry
      await this.vehicleService.addHistoryEntry({
        tenantId: recommendation.tenantId,
        vehicleId: recommendation.vehicleId,
        description: `Recommendation updated: ${recommendation.title}`,
        type: 'SERVICE',
      });

      res.json({ success: true, data: recommendation });
    } catch (error) {
      Logger.error('Update vehicle recommendation error', error);
      res.status(500).json({ success: false, error: 'Failed to update vehicle recommendation' });
    }
  }

  // Delete vehicle recommendation
  async deleteVehicleRecommendation(req: Request, res: Response) {
    try {
      const { recId } = req.params;
      const prisma = require('../../config/database').default;

      const oldRecommendation = await prisma.vehicleRecommendation.findUnique({ where: { id: recId } });
      await prisma.vehicleRecommendation.delete({
        where: { id: recId },
      });

      // Add history entry
      if (oldRecommendation) {
        await this.vehicleService.addHistoryEntry({
          tenantId: oldRecommendation.tenantId,
          vehicleId: oldRecommendation.vehicleId,
          description: `Recommendation deleted: ${oldRecommendation.title}`,
          type: 'SERVICE',
        });
      }

      res.json({ success: true });
    } catch (error) {
      Logger.error('Delete vehicle recommendation error', error);
      res.status(500).json({ success: false, error: 'Failed to delete vehicle recommendation' });
    }
  }
}
