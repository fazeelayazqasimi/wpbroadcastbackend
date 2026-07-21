import mongoose from 'mongoose';

let isConnected = false;
let connecting: Promise<void> | null = null;

export async function connectDB(): Promise<void> {
  if (isConnected) return;
  if (connecting) return connecting;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not defined in environment');
    if (process.env.VERCEL !== '1') process.exit(1);
    return;
  }

  connecting = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
  }).then(() => {
    isConnected = true;
    connecting = null;
    console.log('MongoDB connected successfully');
  }).catch((error) => {
    connecting = null;
    console.error('MongoDB connection error:', error?.message || error);
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('MongoDB disconnected');
  });

  return connecting;
}
