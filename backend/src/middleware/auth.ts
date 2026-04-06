import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'tvet_secret_key_2026';
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, role: string };
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};
