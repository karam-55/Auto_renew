import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '100y'; // Desktop app: tokens don't expire until logout
const REFRESH_TOKEN_EXPIRY = '100y';

export interface TokenPayload {
  id: string;
  tenantId: string;
  role: string;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JWTService {
  private static blacklist = new Set<string>();

  /**
   * Generate a new token pair (access + refresh)
   */
  static generateTokenPair(userId: string, tenantId: string, role: string): TokenPair {
    const jti = crypto.randomUUID();
    const now = Date.now();

    const accessToken = jwt.sign(
      {
        id: userId,
        tenantId,
        role,
        jti,
        type: 'access',
      } as TokenPayload,
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        id: userId,
        tenantId,
        role,
        jti,
        type: 'refresh',
      } as TokenPayload,
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 3153600000, // 100 years in seconds
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      
      // Check if token is blacklisted
      if (this.blacklist.has(decoded.jti)) {
        return null;
      }

      // Ensure it's an access token
      if ((decoded as any).type !== 'access') {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
      
      // Check if token is blacklisted
      if (this.blacklist.has(decoded.jti)) {
        return null;
      }

      // Ensure it's a refresh token
      if ((decoded as any).type !== 'refresh') {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh tokens - generate new pair from refresh token
   * Implements token rotation by blacklisting the old refresh token
   */
  static refreshTokens(refreshToken: string): TokenPair | null {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return null;
      }

      // Blacklist the old refresh token (token rotation)
      this.blacklist.add(decoded.jti);

      // Generate new token pair
      return this.generateTokenPair(decoded.id, decoded.tenantId, decoded.role);
    } catch (error) {
      return null;
    }
  }

  /**
   * Blacklist a token by its jti
   */
  static blacklistToken(jti: string): void {
    this.blacklist.add(jti);
  }

  /**
   * Check if a token is blacklisted
   */
  static isBlacklisted(jti: string): boolean {
    return this.blacklist.has(jti);
  }

  /**
   * Extract jti from token without verification
   */
  static getJti(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded?.jti || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean up expired tokens from blacklist (call periodically)
   */
  static cleanupBlacklist(): void {
    // In production, this should use Redis with TTL
    // For now, we'll keep it simple and not implement auto-cleanup
    // In a real implementation, you'd check token expiry before removing
  }
}
