import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '4000', 10);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db', 'database.sqlite');

const app = express();
app.use(cors());
app.use(express.json());

// DB
let db;
async function initDb() {
  db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  const { readFile } = await import('fs/promises');
  const migrations = await readFile(path.join(__dirname, 'db', 'migrations.sql'), 'utf8');
  await db.exec(migrations);
  // Ensure kuma_status_url column exists on vans
  await db.exec("ALTER TABLE vans ADD COLUMN kuma_status_url TEXT;")
    .catch(() => {});
}

// HTTP server + Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Routes
import authRouter from './routes/auth.js';
import vansRouter from './routes/vans.js';
import logsRouter from './routes/logs.js';
import devicesRouter from './routes/devices.js';
import agentUpdatesRouter from './routes/agent-updates.js';

app.use((req, _res, next) => {
  req.db = db;
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/vans', vansRouter);
app.use('/api/logs', logsRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/agent', agentUpdatesRouter);

// Sockets
import registerSockets from './sockets.js';
registerSockets(io, () => db);
app.locals.io = io;

app.get('/health', (_req, res) => res.json({ ok: true }));

initDb().then(async () => {
  // Seed admin if not exists
  const seed = (await import('./db/seed.js')).default;
  await seed(db);
  server.listen(PORT, () => console.log(`main-dashboard backend listening on :${PORT}`));
}).catch((err) => {
  console.error('Failed to init DB', err);
  process.exit(1);
});


