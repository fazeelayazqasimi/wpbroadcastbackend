import 'dotenv/config';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Template } from './models/Template.js';
import { TargetList } from './models/TargetList.js';
import { Contact } from './models/Contact.js';
import bcrypt from 'bcrypt';

async function seed() {
  await connectDB();

  const existingUser = await User.findOne({ email: 'admin@broadcast.com' });
  if (existingUser) {
    console.log('Seed data already exists, skipping.');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await User.create({
    username: 'Administrator',
    email: 'admin@broadcast.com',
    password: hashedPassword,
    role: 'System Supervisor',
    avatarUrl: '',
  });

  console.log('Created admin user (admin@broadcast.com / admin123)');

  const template1 = await Template.create({
    name: 'Maintenance Alert',
    description: 'Scheduled work notification',
    bodyText: `*Maintenance Notification*\n\nDear {{Customer_Name}},\n\nPlease be informed of scheduled maintenance in {{Location}} on {{Schedule_Time}}.\n\nRegards,\nService Team`,
    isCurrent: true,
  });

  const template2 = await Template.create({
    name: 'Payment Reminder',
    description: 'Standard reminder for outstanding balances',
    bodyText: `*Payment Reminder*\n\nDear {{Customer_Name}},\n\nYour payment for {{Location}} is due on {{Schedule_Time}}. Please clear your dues.\n\nRegards,\nBilling Dept`,
    isCurrent: false,
  });

  console.log('Created templates');

  const list1 = await TargetList.create({
    name: 'Primary Residential Sector',
    description: 'Main residential contact list',
    contactCount: 0,
    status: 'Active',
    lastSent: 'Never',
  });

  const list2 = await TargetList.create({
    name: 'Commercial Clients',
    description: 'Business and corporate clients',
    contactCount: 0,
    status: 'Active',
    lastSent: 'Never',
  });

  console.log('Created target lists');

  await Contact.create([
    { listId: list1._id, name: 'Ahmed Ali', phone: '+92 300 1234567', status: 'Active', lastBroadcast: 'Never' },
    { listId: list1._id, name: 'Sara Malik', phone: '+92 345 5556677', status: 'Active', lastBroadcast: 'Never' },
    { listId: list1._id, name: 'Muhammad Rizwan', phone: '+92 312 4443322', status: 'Active', lastBroadcast: 'Never' },
    { listId: list2._id, name: 'Adnan Qureshi', phone: '+92 300 1112222', status: 'Active', lastBroadcast: 'Never' },
    { listId: list2._id, name: 'Zainab Khan', phone: '+92 321 9876543', status: 'Active', lastBroadcast: 'Never' },
  ]);

  await TargetList.findByIdAndUpdate(list1._id, { contactCount: 3 });
  await TargetList.findByIdAndUpdate(list2._id, { contactCount: 2 });

  console.log('Created contacts');
  console.log('Seed completed successfully');
  process.exit(0);
}

seed();
