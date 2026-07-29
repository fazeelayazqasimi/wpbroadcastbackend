import { Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { AuthRequest } from './auth.js';

export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    req.isAdmin = user.isAdmin;
    req.isSuperAdmin = user.isSuperAdmin;
    req.companyId = user.companyId?.toString() || null;
    req.permissions = user.permissions;
    next();
  } catch {
    res.status(500).json({ error: 'Authorization check failed' });
  }
}
