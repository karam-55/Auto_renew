export interface TokenService {
  generateAccessToken(payload: any): Promise<string>;
  generateRefreshToken(payload: any): Promise<string>;
  verifyAccessToken(token: string): Promise<any>;
  verifyRefreshToken(token: string): Promise<any>;
  decodeToken(token: string): any;
}
