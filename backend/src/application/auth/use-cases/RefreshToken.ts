import { JwtTokenService } from '../../../infrastructure/auth/services/JwtTokenService';

export class RefreshToken {
  constructor(private readonly tokenService: JwtTokenService) {}

  async execute(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    // Generate new access token and rotate refresh token
    const tokens = await this.tokenService.generateTokens(payload);

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }
}
