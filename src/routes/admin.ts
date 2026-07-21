import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { Setting } from '../models/Setting.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users', async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, isAdmin, permissions } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'Operator',
      isAdmin: isAdmin || false,
      permissions: permissions || [],
    });
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:id', async (req: Request, res: Response) => {
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
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
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

export default router;
