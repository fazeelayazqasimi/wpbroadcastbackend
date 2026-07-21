import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'broadcast_panel_jwt_secret_key_2026';

export interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
  permissions?: string[];
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function loadUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.userId) {
      const user = await User.findById(req.userId).select('-password');
      if (user) {
        req.isAdmin = user.isAdmin;
        req.permissions = user.permissions;
      }
    }
    next();
  } catch {
    next();
  }
}
