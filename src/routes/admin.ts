import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Setting } from '../models/Setting.js';
import { Package } from '../models/Package.js';
import { BroadcastLog } from '../models/BroadcastLog.js';
import { TargetList } from '../models/TargetList.js';
import { Contact } from '../models/Contact.js';
import { Template } from '../models/Template.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';


const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

/* ── My Company (for company admins) ── */

router.get('/company', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      res.status(400).json({ error: 'No company associated' });
      return;
    }
    const company = await Company.findById(req.companyId)
      .populate('packageId')
      .populate('createdBy', 'username email');
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    const [userCount, listCount, contactCount, broadcastCount, templateCount] = await Promise.all([
      User.countDocuments({ companyId: company._id }),
      TargetList.countDocuments({ companyId: company._id }),
      Contact.countDocuments({ companyId: company._id }),
      BroadcastLog.countDocuments({ companyId: company._id }),
      Template.countDocuments({ companyId: company._id }),
    ]);
    res.json({
      ...company.toObject(),
      userCount, listCount, contactCount, broadcastCount, templateCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.companyId && !req.isSuperAdmin) {
      filter.companyId = req.companyId;
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, role, isAdmin, permissions } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: Record<string, unknown> = {
      username,
      email,
      password: hashedPassword,
      role: role || 'Operator',
      isAdmin: isAdmin || false,
      permissions: permissions || [],
    };
    if (req.companyId && !req.isSuperAdmin) {
      userData.companyId = req.companyId;
    }
    const user = await User.create(userData);
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, role, isAdmin, permissions } = req.body;
    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const filter: Record<string, unknown> = { _id: req.params.id };
    if (req.companyId && !req.isSuperAdmin) {
      filter.companyId = req.companyId;
    }
    const user = await User.findOneAndUpdate(filter, updateData, { new: true }).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = { _id: req.params.id };
    if (req.companyId && !req.isSuperAdmin) {
      filter.companyId = req.companyId;
    }
    const user = await User.findOneAndDelete(filter);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await Setting.find().sort({ category: 1, key: 1 });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings/:id', async (req: Request, res: Response) => {
  try {
    const { value, description } = req.body;
    const setting = await Setting.findByIdAndUpdate(
      req.params.id,
      { value, description },
      { new: true }
    );
    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

router.post('/settings', async (req: Request, res: Response) => {
  try {
    const { key, value, description, category } = req.body;
    const existing = await Setting.findOne({ key });
    if (existing) {
      res.status(400).json({ error: 'Setting key already exists' });
      return;
    }
    const setting = await Setting.create({ key, value, description, category });
    res.status(201).json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create setting' });
  }
});

router.delete('/settings/:id', async (req: Request, res: Response) => {
  try {
    const setting = await Setting.findByIdAndDelete(req.params.id);
    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    res.json({ message: 'Setting deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

router.get('/guide', async (_req: Request, res: Response) => {
  try {
    const guideSettings = await Setting.find({ category: 'guide' });
    res.json(guideSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guide' });
  }
});

/* ── Company self-service settings (for company admins) ── */

router.get('/company-settings', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      res.status(400).json({ error: 'No company associated with this user' });
      return;
    }
    const company = await Company.findById(req.companyId).select(
      'name whatsappAccessToken whatsappPhoneNumberId whatsappBusinessAccountId whatsappVerifyToken whatsappApiVersion'
    );
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
});

router.put('/company-settings', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      res.status(400).json({ error: 'No company associated with this user' });
      return;
    }
    const allowed = [
      'whatsappAccessToken', 'whatsappPhoneNumberId',
      'whatsappBusinessAccountId', 'whatsappVerifyToken', 'whatsappApiVersion',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const company = await Company.findByIdAndUpdate(req.companyId, update, { new: true }).select(
      'name whatsappAccessToken whatsappPhoneNumberId whatsappBusinessAccountId whatsappVerifyToken whatsappApiVersion'
    );
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update company settings' });
  }
});

export default router;
