import { StockMovementRepository } from '../../../application/inventory/interfaces/StockMovementRepository';
import { StockMovement } from '../../../domain/inventory/entities/StockMovement';
import { MovementType } from '../../../domain/inventory/entities/StockMovement';
import { MovementReference } from '../../../domain/inventory/value-objects/MovementReference';
import { TransactionType } from '@prisma/client';
import prisma from '../../../config/database';

export class PrismaStockMovementRepository implements StockMovementRepository {
  async findById(id: string): Promise<StockMovement | null> {
    const transaction = await prisma.inventoryTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return null;
    }

    return this.mapToDomain(transaction);
  }

  async findByPartId(partId: string): Promise<StockMovement[]> {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { partId },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(t => this.mapToDomain(t));
  }

  async findByTenantId(tenantId: string): Promise<StockMovement[]> {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(t => this.mapToDomain(t));
  }

  async findByType(tenantId: string, type: MovementType): Promise<StockMovement[]> {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        tenantId,
        type: this.mapMovementTypeToTransactionType(type) as TransactionType,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(t => this.mapToDomain(t));
  }

  async create(movement: StockMovement): Promise<StockMovement> {
    const createdTransaction = await prisma.inventoryTransaction.create({
      data: {
        id: movement.id,
        tenantId: movement.tenantId,
        partId: movement.partId,
        warehouseId: movement.warehouseId,
        type: this.mapMovementTypeToTransactionType(movement.type) as TransactionType,
        quantity: movement.getQuantityValue(),
        costSYP: movement.costSYP,
        costUSD: movement.costUSD,
        reference: movement.reference.getValue(),
        notes: movement.notes,
        createdAt: movement.createdAt,
        updatedAt: movement.createdAt,
      },
    });

    return this.mapToDomain(createdTransaction);
  }

  async delete(id: string): Promise<void> {
    await prisma.inventoryTransaction.delete({
      where: { id },
    });
  }

  private mapToDomain(prismaTransaction: any): StockMovement {
    const reference = new MovementReference(prismaTransaction.reference || 'MOV-DEFAULT');
    const movementType = this.mapTransactionTypeToMovementType(prismaTransaction.type);

    return StockMovement.createWithReference(
      prismaTransaction.id,
      prismaTransaction.tenantId,
      prismaTransaction.partId,
      movementType,
      prismaTransaction.quantity,
      Number(prismaTransaction.costSYP),
      reference,
      prismaTransaction.warehouseId,
      prismaTransaction.costUSD ? Number(prismaTransaction.costUSD) : undefined,
      prismaTransaction.notes
    );
  }

  private mapMovementTypeToTransactionType(movementType: MovementType): string {
    // Map MovementType.IN/OUT to TransactionType values
    // IN -> PURCHASE, OUT -> SALE (simplified mapping)
    return movementType === MovementType.IN ? 'PURCHASE' : 'SALE';
  }

  private mapTransactionTypeToMovementType(transactionType: string): MovementType {
    // Map TransactionType to MovementType
    const inboundTypes = ['PURCHASE', 'ADJUSTMENT', 'TRANSFER'];
    return inboundTypes.includes(transactionType) ? MovementType.IN : MovementType.OUT;
  }
}
