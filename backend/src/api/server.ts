import express, { Express, Request, Response, NextFunction } from 'express';
import { ErrorMiddleware } from './middlewares/error.middleware';
import { SecurityMiddleware } from './middlewares/security.middleware';
import { SanitizationMiddleware } from './middlewares/sanitization.middleware';
import { RateLimitMiddleware } from './middlewares/rate-limit.middleware';
import { LoggingMiddleware } from './middlewares/logging.middleware';
import { CacheService } from './services/cache.service';
import { Logger } from '../infrastructure/logging/logger';
import routes from './routes';

export class Server {
  private app: Express;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.initializeServices();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  /**
   * Initialize external services (Redis, etc.)
   */
  private async initializeServices(): Promise<void> {
    try {
      await CacheService.connect();
      Logger.info('Cache service initialized');
    } catch (error) {
      Logger.warn('Cache service initialization failed, continuing without cache');
    }
  }

  private configureMiddleware(): void {
    // Security headers (helmet, CSP, HSTS)
    this.app.use(SecurityMiddleware.applyHelmet());
    this.app.use(SecurityMiddleware.additionalHeaders());

    // CORS with strict rules
    this.app.use(SecurityMiddleware.configureCors());

    // Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Input sanitization
    this.app.use(SanitizationMiddleware.sanitizeBody());
    this.app.use(SanitizationMiddleware.sanitizeQuery());
    this.app.use(SanitizationMiddleware.sanitizeParams());

    // Logging
    this.app.use(LoggingMiddleware.requestLogger());
    this.app.use(LoggingMiddleware.slowRequestLogger(300));

    // Rate limiting
    this.app.use(RateLimitMiddleware.globalLimiter());

    // Specific rate limiters will be applied in routes
  }

  private configureRoutes(): void {
    this.app.use('/api', routes);
    
    // Health check endpoint (no rate limiting)
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      });
    });
  }

  private configureErrorHandling(): void {
    // Error logging
    this.app.use(LoggingMiddleware.errorLogger());

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      ErrorMiddleware.error(res, 'NOT_FOUND', 'Route not found', 404);
    });

    // Global error handler
    this.app.use(ErrorMiddleware.handle);
  }

  public async start(): Promise<void> {
    try {
      this.app.listen(this.port, () => {
        Logger.info(`Server is running on port ${this.port}`);
        Logger.info(`Health check: http://localhost:${this.port}/health`);
        Logger.info(`API base: http://localhost:${this.port}/api`);
        Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      Logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  public getApp(): Express {
    return this.app;
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    Logger.info('Shutting down server...');
    await CacheService.disconnect();
    Logger.info('Server shutdown complete');
    process.exit(0);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server(parseInt(process.env.PORT || '3000'));
  server.start();

  // Handle graceful shutdown
  process.on('SIGTERM', () => server.shutdown());
  process.on('SIGINT', () => server.shutdown());
}
