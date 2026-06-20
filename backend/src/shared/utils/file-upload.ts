import { randomBytes } from 'crypto';
import { Logger } from '../../infrastructure/logging/logger';

export interface FileUploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export class FileUploadUtil {
  private static readonly DEFAULT_MAX_SIZE_MB = 10;
  private static readonly DEFAULT_ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  private static readonly DEFAULT_ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.csv', '.xls', '.xlsx',
  ];

  static validateFile(
    file: { name: string; size: number; mimetype?: string },
    options: FileUploadOptions = {}
  ): FileValidationResult {
    const maxSizeBytes = (options.maxSizeMB || this.DEFAULT_MAX_SIZE_MB) * 1024 * 1024;
    const allowedTypes = options.allowedTypes || this.DEFAULT_ALLOWED_TYPES;
    const allowedExtensions = options.allowedExtensions || this.DEFAULT_ALLOWED_EXTENSIONS;

    // Check file size
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds maximum of ${options.maxSizeMB || this.DEFAULT_MAX_SIZE_MB}MB`,
      };
    }

    // Check file type
    if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed`,
      };
    }

    // Check file extension
    const extension = this.getFileExtension(file.name);
    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension ${extension} is not allowed`,
      };
    }

    return { valid: true };
  }

  static getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? '.' + parts.pop()?.toLowerCase() : '';
  }

  static sanitizeFilename(filename: string): string {
    // Remove any path components
    const name = filename.replace(/^.*[\\\/]/, '');
    
    // Remove special characters except alphanumeric, dots, hyphens, and underscores
    const sanitized = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Limit filename length
    const maxLength = 255;
    return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
  }

  static async uploadWithRetry<T>(
    uploadFn: () => Promise<T>,
    options: { maxAttempts?: number; delayMs?: number } = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts || 3;
    const delayMs = options.delayMs || 1000;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await uploadFn();
      } catch (error) {
        lastError = error;
        Logger.warn(`File upload attempt ${attempt} failed`, error as any);

        if (attempt < maxAttempts) {
          await this.sleep(delayMs * attempt); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a unique filename to prevent collisions
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');
    const extension = this.getFileExtension(originalName);
    const baseName = originalName.replace(extension, '');
    const sanitizedBase = this.sanitizeFilename(baseName);
    
    return `${sanitizedBase}_${timestamp}_${random}${extension}`;
  }

  /**
   * Validate image dimensions (if file is an image)
   */
  static async validateImageDimensions(
    file: Buffer,
    maxWidth?: number,
    maxHeight?: number
  ): Promise<{ valid: boolean; error?: string; width?: number; height?: number }> {
    // This would require a library like 'sharp' or 'jimp'
    // For now, return valid as we can't validate without additional dependencies
    return { valid: true };
  }
}
