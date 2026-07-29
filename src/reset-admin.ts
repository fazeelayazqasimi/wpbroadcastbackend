import 'dotenv/config';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Setting } from './models/Setting.js';
import bcrypt from 'bcryptjs';

async function reset() {
  await connectDB();

  const hashedPassword = await bcrypt.hash('Admin@123!', 10);

  const existing = await User.findOne({ email: 'admin@broadcast.com' });
  if (existing) {
    existing.password = hashedPassword;
    existing.isAdmin = true;
    existing.isSuperAdmin = true;
    existing.role = 'Super Admin';
    if (!existing.permissions?.includes('chat')) {
      existing.permissions = [...(existing.permissions || []), 'chat'];
    }
    await existing.save();
    console.log('Super admin password reset to Admin@123!, permissions verified');
  } else {
    await User.create({
      username: 'Super Admin',
      email: 'admin@broadcast.com',
      password: hashedPassword,
      role: 'Super Admin',
      isAdmin: true,
      isSuperAdmin: true,
      permissions: ['dashboard', 'lists', 'compose', 'admin', 'chat'],
    });
    console.log('Super admin user created');
  }

  const verify = await User.findOne({ email: 'admin@broadcast.com' }).select('+password');
  if (verify) {
    const match = await bcrypt.compare('Admin@123!', verify.password);
    console.log('Password verification:', match ? 'OK' : 'FAILED');
  }

  process.exit(0);
}

reset();
