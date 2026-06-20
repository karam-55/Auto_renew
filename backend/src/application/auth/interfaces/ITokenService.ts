export interface ITokenService {
  generateToken(employeeId: string, role: string): Promise<string>;
  verifyToken(token: string): Promise<{ employeeId: string; role: string } | null>;
}
