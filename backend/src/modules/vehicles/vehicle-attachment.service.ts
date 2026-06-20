import prisma from '../../config/database';
import { VehicleService as VehicleManagementService } from './vehicle.service';

export class VehicleAttachmentService {
  private vehicleManagementService: VehicleManagementService;

  constructor() {
    this.vehicleManagementService = new VehicleManagementService();
  }
  async getVehicleAttachments(tenantId: string, vehicleId: string) {
    const attachments = await prisma.vehicleAttachment.findMany({
      where: { tenantId, vehicleId },
      orderBy: { createdAt: 'desc' },
    });

    return attachments;
  }

  async createVehicleAttachment(
    tenantId: string,
    vehicleId: string,
    fileUrl: string,
    type: 'IMAGE' | 'DOCUMENT',
    name?: string,
    description?: string,
    uploadedBy?: string
  ) {
    // Verify vehicle exists and belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const attachment = await prisma.vehicleAttachment.create({
      data: {
        tenantId,
        vehicleId,
        fileUrl,
        type,
        name,
        description,
        uploadedBy,
      },
    });

    // Add history entry
    await this.vehicleManagementService.addHistoryEntry({
      tenantId,
      vehicleId,
      description: `Attachment added: ${name || description || type}`,
      type: 'PART_CONSUMPTION',
    });

    return attachment;
  }

  async deleteVehicleAttachment(tenantId: string, attachmentId: string) {
    // Verify attachment exists and belongs to tenant
    const attachment = await prisma.vehicleAttachment.findFirst({
      where: { id: attachmentId, tenantId },
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    await prisma.vehicleAttachment.delete({
      where: { id: attachmentId },
    });
  }
}
