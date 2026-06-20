import { GRNRepository as IGRNRepository } from '../../../application/inventory/interfaces/GRNRepository';
import { GRN } from '../../../domain/inventory/grn/entities/GRN';
import { GRNNumber } from '../../../domain/inventory/grn/value-objects/GRNNumber';
import { SupplierId } from '../../../domain/inventory/po/value-objects/SupplierId';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';
import { QueueService } from '../../../queues/queue.service';
import { JobTypes } from '../../../queues/queue.config';

export class GRNRepository implements IGRNRepository {
  async findById(id: string): Promise<GRN | null> {
    try {
      const prisma = PrismaService.getInstance();
      const grn = await prisma.goodsReceiptNote.findUnique({
        where: { id },
      });
      if (!grn) return null;
      return this.mapToDomain(grn);
    } catch (error) {
      throw new DatabaseError('Failed to find GRN by id', error);
    }
  }

  async findByGRNNumber(grnNumber: string): Promise<GRN | null> {
    try {
      const prisma = PrismaService.getInstance();
      const grn = await prisma.goodsReceiptNote.findUnique({
        where: { grnNumber },
      });
      if (!grn) return null;
      return this.mapToDomain(grn);
    } catch (error) {
      throw new DatabaseError('Failed to find GRN by number', error);
    }
  }

  async findByTenantId(tenantId: string): Promise<GRN[]> {
    try {
      const prisma = PrismaService.getInstance();
      const grns = await prisma.goodsReceiptNote.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
      return grns.map(grn => this.mapToDomain(grn));
    } catch (error) {
      throw new DatabaseError('Failed to find GRNs by tenant', error);
    }
  }

  async findByPurchaseOrderId(purchaseOrderId: string): Promise<GRN[]> {
    try {
      const prisma = PrismaService.getInstance();
      const grns = await prisma.goodsReceiptNote.findMany({
        where: { purchaseOrderId },
        orderBy: { createdAt: 'desc' },
      });
      return grns.map(grn => this.mapToDomain(grn));
    } catch (error) {
      throw new DatabaseError('Failed to find GRNs by purchase order', error);
    }
  }

  async create(grn: GRN): Promise<GRN> {
    try {
      const prisma = PrismaService.getInstance();
      const created = await prisma.goodsReceiptNote.create({
        data: {
          id: grn.id,
          tenantId: grn.tenantId,
          supplierId: grn.supplierId.getValue(),
          grnNumber: grn.grnNumber.getValue(),
          purchaseOrderId: grn.purchaseOrderId,
          receivedDate: grn.receivedDate,
          notes: grn.notes,
          status: grn.isReceived ? 'COMPLETED' : 'DRAFT',
          receivedBy: 'system',
        },
      });
      return this.mapToDomain(created);
    } catch (error) {
      throw new DatabaseError('Failed to create GRN', error);
    }
  }

  async update(grn: GRN): Promise<GRN> {
    try {
      const prisma = PrismaService.getInstance();
      
      // Use transaction for GRN finalization with stock movements and cost updates
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.goodsReceiptNote.update({
          where: { id: grn.id },
          data: {
            notes: grn.notes,
            status: grn.isReceived ? 'COMPLETED' : 'DRAFT',
          },
        });

        // If GRN is being finalized (COMPLETED), create stock movements and update costs
        if (grn.isReceived) {
          // Get GRN lines
          const grnLines = await tx.goodsReceiptNoteLine.findMany({
            where: { grnId: grn.id },
            include: { part: true },
          });

          for (const line of grnLines) {
            // Create stock movement (IN)
            await tx.inventoryTransaction.create({
              data: {
                id: crypto.randomUUID(),
                tenantId: grn.tenantId,
                partId: line.partId,
                type: 'PURCHASE',
                quantity: line.receivedQuantity,
                costSYP: line.unitCost,
                costUSD: line.part?.costUSD,
                reference: `GRN-${grn.grnNumber.getValue()}`,
                notes: `GRN receipt for ${line.part?.name || line.partId}`,
              },
            });

            // Update part quantity
            await tx.part.update({
              where: { id: line.partId },
              data: {
                quantity: {
                  increment: line.receivedQuantity,
                },
                costSYP: line.unitCost,
                costUSD: line.part?.costUSD,
              },
            });

            // Update purchase order item received quantity
            if (grn.purchaseOrderId) {
              await tx.purchaseOrderItem.updateMany({
                where: {
                  purchaseOrderId: grn.purchaseOrderId,
                  partId: line.partId,
                },
                data: {
                  receivedQty: {
                    increment: line.receivedQuantity,
                  },
                },
              });
            }
          }
        }

        return updated;
      });

      // If GRN is being finalized, add inventory job
      if (grn.isReceived) {
        await QueueService.addInventoryJob(JobTypes.PROCESS_GRN, {
          grnId: grn.id,
          tenantId: grn.tenantId,
        });
      }

      return this.mapToDomain(result);
    } catch (error) {
      throw new DatabaseError('Failed to update GRN', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const prisma = PrismaService.getInstance();
      await prisma.goodsReceiptNote.delete({
        where: { id },
      });
    } catch (error) {
      throw new DatabaseError('Failed to delete GRN', error);
    }
  }

  private mapToDomain(data: any): GRN {
    return new GRN(
      data.id,
      data.tenantId,
      new GRNNumber(data.grnNumber),
      data.purchaseOrderId,
      new SupplierId(data.supplierId),
      data.receivedDate,
      data.notes,
      data.status === 'COMPLETED',
      data.createdAt,
      data.updatedAt
    );
  }
}
