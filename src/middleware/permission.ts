import { Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { AuthRequest } from './auth.js';

export function requirePermission(...pages: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (user.isAdmin || user.isSuperAdmin) {
        req.isAdmin = user.isAdmin;
        req.isSuperAdmin = user.isSuperAdmin;
        req.companyId = user.companyId?.toString() || null;
        req.permissions = user.permissions;
        next();
        return;
      }
      const hasPermission = pages.some(p => user.permissions.includes(p));
      if (!hasPermission) {
        res.status(403).json({ error: 'Access denied. You do not have permission for this resource.' });
        return;
      }
      req.companyId = user.companyId?.toString() || null;
      req.permissions = user.permissions;
      next();
    } catch {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}
