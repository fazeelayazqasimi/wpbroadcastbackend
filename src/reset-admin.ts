import 'dotenv/config';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Setting } from './models/Setting.js';
import bcrypt from 'bcryptjs';

async function reset() {
  await connectDB();

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const existing = await User.findOne({ email: 'admin@broadcast.com' });
  if (existing) {
    existing.password = hashedPassword;
    existing.isAdmin = true;
    if (!existing.permissions?.includes('chat')) {
      existing.permissions = [...(existing.permissions || []), 'chat'];
    }
    await existing.save();
    console.log('Admin password reset to admin123, permissions verified');
  } else {
    await User.create({
      username: 'Administrator',
      email: 'admin@broadcast.com',
      password: hashedPassword,
      role: 'System Supervisor',
      isAdmin: true,
      permissions: ['dashboard', 'lists', 'compose', 'admin', 'chat'],
    });
    console.log('Admin user created');
  }

  const verify = await User.findOne({ email: 'admin@broadcast.com' }).select('+password');
  if (verify) {
    const match = await bcrypt.compare('admin123', verify.password);
    console.log('Password verification:', match ? 'OK' : 'FAILED');
  }

  process.exit(0);
}

reset();
