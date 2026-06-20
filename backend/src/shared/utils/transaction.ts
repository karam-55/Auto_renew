import prisma from '../../config/database';
import { Logger } from '../../infrastructure/logging/logger';

/**
 * Transaction Wrapper Utility
 * Provides a safe way to execute multi-table database operations
 * with automatic rollback on failure.
 *
 * Usage:
 *   const result = await withTransaction(async (tx) => {
 *     const booking = await tx.booking.create({ data: {...} });
 *     await tx.invoice.create({ data: { bookingId: booking.id, ... } });
 *     return booking;
 *   });
 */

export type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export async function withTransaction<T>(
  callback: (tx: TransactionClient) => Promise<T>,
  options: { maxRetries?: number; retryDelayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 0, retryDelayMs = 100 } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        return await callback(tx as unknown as TransactionClient);
      }, {
        maxWait: 5000,
        timeout: 10000,
      });
    } catch (error) {
      lastError = error as Error;
      Logger.warn('Transaction failed, retrying...', {
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
        error: (error as Error).message,
      });

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
      }
    }
  }

  Logger.error('Transaction failed after all retries', lastError);
  throw lastError;
}

/**
 * Sequential transaction for independent operations
 * Executes multiple operations in sequence within a single transaction
 */
export async function withSequentialTransaction<T>(
  operations: ((tx: TransactionClient) => Promise<any>)[]
): Promise<any[]> {
  return await prisma.$transaction(async (tx) => {
    const results: any[] = [];
    for (const operation of operations) {
      const result = await operation(tx as unknown as TransactionClient);
      results.push(result);
    }
    return results;
  }, {
    maxWait: 5000,
    timeout: 15000,
  });
}

/**
 * Isolation level helper for critical financial transactions
 */
export async function withSerializableTransaction<T>(
  callback: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await callback(tx as unknown as TransactionClient);
  }, {
    isolationLevel: 'Serializable',
    maxWait: 5000,
    timeout: 10000,
  });
}
