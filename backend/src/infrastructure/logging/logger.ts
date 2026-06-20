export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  tenantId?: string;
  [key: string]: any;
}

export class Logger {
  private static isProduction = process.env.NODE_ENV === 'production';
  private static isDevelopment = process.env.NODE_ENV === 'development';

  private static formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  private static formatJson(level: LogLevel, message: string, context?: LogContext): object {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };
  }

  static debug(message: string, context?: LogContext): void {
    if (this.isProduction) return; // Skip debug in production
    const logData = this.isProduction ? this.formatJson(LogLevel.DEBUG, message, context) : this.formatMessage(LogLevel.DEBUG, message, context);
    console.debug(logData);
  }

  static info(message: string, context?: LogContext): void {
    const logData = this.isProduction ? this.formatJson(LogLevel.INFO, message, context) : this.formatMessage(LogLevel.INFO, message, context);
    console.info(logData);
  }

  static warn(message: string, context?: LogContext): void {
    const logData = this.isProduction ? this.formatJson(LogLevel.WARN, message, context) : this.formatMessage(LogLevel.WARN, message, context);
    console.warn(logData);
  }

  static error(message: string, error?: any, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error ? {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        code: error.code,
      } : undefined,
    };
    const logData = this.isProduction ? this.formatJson(LogLevel.ERROR, message, errorContext) : this.formatMessage(LogLevel.ERROR, message, errorContext);
    console.error(logData);
  }
}
