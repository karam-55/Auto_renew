import { Logger } from '../infrastructure/logging/logger';

export interface EnvVarConfig {
  name: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  validator?: (value: string) => boolean;
}

export class EnvValidator {
  private static configs: EnvVarConfig[] = [
    // Database
    { name: 'DATABASE_URL', required: true, description: 'PostgreSQL connection string' },
    
    // JWT
    { name: 'JWT_SECRET', required: true, description: 'JWT signing secret' },
    { name: 'JWT_REFRESH_SECRET', required: true, description: 'JWT refresh token secret' },
    
    // Server
    { name: 'PORT', required: false, defaultValue: '8080', description: 'Server port' },
    { name: 'NODE_ENV', required: false, defaultValue: 'development', description: 'Environment (development/production)' },
    
    // Redis (optional)
    { name: 'REDIS_URL', required: false, description: 'Redis connection URL' },
    
    // MinIO (optional)
    { name: 'MINIO_ENDPOINT', required: false, description: 'MinIO endpoint' },
    { name: 'MINIO_ACCESS_KEY', required: false, description: 'MinIO access key' },
    { name: 'MINIO_SECRET_KEY', required: false, description: 'MinIO secret key' },
    { name: 'MINIO_BUCKET', required: false, description: 'MinIO bucket name' },
    
    // WhatsApp (optional)
    { name: 'WHATSAPP_API_URL', required: false, description: 'WhatsApp API URL' },
    { name: 'WHATSAPP_API_KEY', required: false, description: 'WhatsApp API key' },
    
    // FCM (optional)
    { name: 'FCM_SERVER_KEY', required: false, description: 'Firebase Cloud Messaging server key' },
    
    // Email (optional)
    { name: 'SMTP_HOST', required: false, description: 'SMTP host' },
    { name: 'SMTP_PORT', required: false, description: 'SMTP port' },
    { name: 'SMTP_USER', required: false, description: 'SMTP username' },
    { name: 'SMTP_PASS', required: false, description: 'SMTP password' },
  ];

  static validate(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const config of this.configs) {
      const value = process.env[config.name];

      if (config.required && !value) {
        errors.push(`Required environment variable '${config.name}' is missing. ${config.description || ''}`);
        continue;
      }

      if (!value && config.defaultValue) {
        process.env[config.name] = config.defaultValue;
        warnings.push(`Environment variable '${config.name}' not set, using default: ${config.defaultValue}`);
      }

      if (value && config.validator && !config.validator(value)) {
        errors.push(`Environment variable '${config.name}' has invalid value. ${config.description || ''}`);
      }
    }

    // Validate JWT secrets are not using default values in production
    if (process.env.NODE_ENV === 'production') {
      if (process.env.JWT_SECRET === 'default-secret' || process.env.JWT_SECRET === 'your-secret-key') {
        errors.push('JWT_SECRET must be changed from default value in production');
      }
      if (process.env.JWT_REFRESH_SECRET === 'default-refresh-secret' || process.env.JWT_REFRESH_SECRET === 'your-refresh-secret') {
        errors.push('JWT_REFRESH_SECRET must be changed from default value in production');
      }
    }

    // Validate JWT secret length
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters for security');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  static validateOrFail(): void {
    const result = this.validate();

    if (result.warnings.length > 0) {
      Logger.warn('Environment validation warnings:');
      result.warnings.forEach(warning => Logger.warn(warning));
    }

    if (!result.valid) {
      Logger.error('Environment validation failed:');
      result.errors.forEach(error => Logger.error(error));
      throw new Error('Environment validation failed. Required environment variables are missing or invalid.');
    }

    Logger.info('Environment validation passed');
  }

  static printConfig(): void {
    Logger.info('Environment Configuration:');
    this.configs.forEach(config => {
      const value = process.env[config.name];
      const masked = this.shouldMask(config.name);
      const displayValue = masked ? '***MASKED***' : (value || 'NOT SET');
      const required = config.required ? '[REQUIRED]' : '[OPTIONAL]';
      Logger.info(`  ${required} ${config.name}: ${displayValue}`);
    });
  }

  private static shouldMask(name: string): boolean {
    const sensitiveKeys = ['SECRET', 'KEY', 'PASSWORD', 'PASS', 'TOKEN'];
    return sensitiveKeys.some(key => name.includes(key));
  }
}
