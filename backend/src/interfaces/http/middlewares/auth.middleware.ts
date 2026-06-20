import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../../../infrastructure/auth/services/JwtTokenService';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);
    const tokenService = new JwtTokenService();

    try {
      const decoded = await tokenService.verifyAccessToken(token);
      
      // Attach user info to request
      (req as any).user = decoded;
      
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};
