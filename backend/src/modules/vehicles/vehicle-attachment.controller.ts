import { Request, Response } from 'express';
import { VehicleAttachmentService } from './vehicle-attachment.service';
import { saveBase64Image, deleteFile } from '../../middleware/file-upload.middleware';
import { Logger } from '../../infrastructure/logging/logger';
import { v4 as uuidv4 } from 'uuid';

export class VehicleAttachmentController {
  private attachmentService: VehicleAttachmentService;

  constructor() {
    this.attachmentService = new VehicleAttachmentService();
  }

  async getVehicleAttachments(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { vehicleId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const attachments = await this.attachmentService.getVehicleAttachments(tenantId, vehicleId);
      res.json(attachments);
    } catch (error) {
      Logger.error('Error fetching vehicle attachments:', error);
      res.status(500).json({ error: 'Failed to fetch attachments' });
    }
  }

  async uploadVehicleAttachment(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id: vehicleId } = req.params;
      const { fileData, type, name, description } = req.body;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!fileData || !type) {
        return res.status(400).json({ error: 'fileData and type are required' });
      }

      // Generate unique filename
      const filename = `${uuidv4()}.jpg`;
      
      // Save the base64 image
      const fileUrl = saveBase64Image(fileData, filename);

      // Create attachment record in database
      const attachment = await this.attachmentService.createVehicleAttachment(
        tenantId,
        vehicleId,
        fileUrl,
        type,
        name || description,
        description,
        userRole || 'Unknown'
      );

      res.status(201).json(attachment);
    } catch (error: any) {
      Logger.error('Error uploading vehicle attachment:', error);
      res.status(500).json({ error: error.message || 'Failed to upload attachment' });
    }
  }

  async deleteVehicleAttachment(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { attachmentId } = req.params;

      Logger.debug('Delete vehicle attachment called');
      Logger.debug('Delete vehicle attachment', { tenantId, attachmentId });

      if (!tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get attachment to delete file
      const prisma = require('../../config/database').default;
      const attachment = await prisma.vehicleAttachment.findFirst({
        where: { id: attachmentId, tenantId },
      });

      Logger.debug('Attachment found', { attachmentId: attachment?.id });

      if (attachment) {
        // Delete file from disk
        Logger.debug('Deleting file', { fileUrl: attachment.fileUrl });
        try {
          deleteFile(attachment.fileUrl);
          Logger.debug('File deleted successfully');
        } catch (fileError) {
          Logger.error('Error deleting file:', fileError);
          // Continue with database deletion even if file deletion fails
        }
      }

      await this.attachmentService.deleteVehicleAttachment(tenantId, attachmentId);
      Logger.debug('Attachment deleted from database');
      res.status(204).send();
    } catch (error: any) {
      Logger.error('Error deleting vehicle attachment:', error);
      Logger.error('Error stack:', error.stack);
      res.status(500).json({ error: error.message || 'Failed to delete attachment' });
    }
  }
}
