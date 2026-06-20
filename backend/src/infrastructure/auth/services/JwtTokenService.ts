import { TokenService } from '../../../application/auth/interfaces/TokenService';
import jwt from 'jsonwebtoken';

export class JwtTokenService implements TokenService {
  private readonly accessTokenSecret = process.env.JWT_SECRET || 'default-secret';
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
  private readonly accessTokenExpiry = '100y';
  private readonly refreshTokenExpiry = '100y';

  async generateAccessToken(payload: any): Promise<string> {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });
  }

  async generateRefreshToken(payload: any): Promise<string> {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    });
  }

  async generateTokens(payload: any): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<any> {
    return jwt.verify(token, this.accessTokenSecret);
  }

  async verifyRefreshToken(token: string): Promise<any> {
    return jwt.verify(token, this.refreshTokenSecret);
  }

  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
