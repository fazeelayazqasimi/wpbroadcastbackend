import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import listRoutes from './routes/lists.js';
import contactRoutes from './routes/contacts.js';
import broadcastRoutes from './routes/broadcasts.js';
import templateRoutes from './routes/templates.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/templates', templateRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
