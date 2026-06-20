import { Logger } from '../../infrastructure/logging/logger';

export interface ShutdownHandler {
  name: string;
  handler: () => Promise<void>;
  timeout?: number;
}

export class GracefulShutdown {
  private static handlers: ShutdownHandler[] = [];
  private static isShuttingDown = false;

  static register(handler: ShutdownHandler): void {
    this.handlers.push(handler);
  }

  static async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      Logger.warn('Shutdown already in progress, ignoring signal');
      return;
    }

    this.isShuttingDown = true;
    Logger.info(`Received ${signal} signal, starting graceful shutdown`);

    const shutdownPromises = this.handlers.map(async (handler) => {
      const timeout = handler.timeout || 10000; // Default 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout: ${handler.name} did not shutdown in time`)), timeout);
      });

      try {
        Logger.info(`Shutting down ${handler.name}...`);
        await Promise.race([handler.handler(), timeoutPromise]);
        Logger.info(`${handler.name} shutdown complete`);
      } catch (error) {
        Logger.error(`Error shutting down ${handler.name}`, error);
      }
    });

    await Promise.all(shutdownPromises);
    Logger.info('Graceful shutdown complete');
    process.exit(0);
  }

  static setup(): void {
    // Handle termination signals
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught Exception', error);
      this.shutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      Logger.error('Unhandled Rejection', reason, { promise });
      this.shutdown('UNHANDLED_REJECTION');
    });
  }
}

/**
 * Pre-configured shutdown handlers for common services
 */
export const ShutdownHandlers = {
  database: (prismaClient: any): ShutdownHandler => ({
    name: 'Database',
    handler: async () => {
      await prismaClient.$disconnect();
    },
    timeout: 10000,
  }),

  redis: (redisClient: any): ShutdownHandler => ({
    name: 'Redis',
    handler: async () => {
      if (redisClient && typeof redisClient.quit === 'function') {
        await redisClient.quit();
      } else if (redisClient && typeof redisClient.disconnect === 'function') {
        await redisClient.disconnect();
      }
    },
    timeout: 5000,
  }),

  httpServer: (server: any): ShutdownHandler => ({
    name: 'HTTP Server',
    handler: async () => {
      return new Promise((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    },
    timeout: 10000,
  }),

  queue: (queue: any): ShutdownHandler => ({
    name: 'Queue',
    handler: async () => {
      if (queue && typeof queue.close === 'function') {
        await queue.close();
      }
    },
    timeout: 5000,
  }),

  socketIO: (io: any): ShutdownHandler => ({
    name: 'Socket.IO',
    handler: async () => {
      return new Promise((resolve) => {
        io.close(() => {
          resolve();
        });
      });
    },
    timeout: 5000,
  }),
};
