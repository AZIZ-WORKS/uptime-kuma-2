import express from 'express';
import http from 'http';
import axios from 'axios';
import { io as ioClient } from 'socket.io-client';
import wol from 'wake_on_lan';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '5000', 10);
const DASHBOARD_WS_URL = process.env.DASHBOARD_WS_URL || '';
const VAN_ID = process.env.VAN_ID || 'van-unknown';
const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL || '10000', 10);
const KUMA_URL = process.env.KUMA_URL || 'http://localhost:3001';

let socket = null;
let lastStatus = null;

function connectSocket() {
  if (!DASHBOARD_WS_URL) {
    console.warn('DASHBOARD_WS_URL not set, skipping socket connection');
    return;
  }
  socket = ioClient(DASHBOARD_WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('Connected to dashboard');
    socket.emit('agent:hello', {
      vanId: VAN_ID,
      agentApiUrl: process.env.AGENT_PUBLIC_URL || null,
    });
  });

  socket.on('disconnect', (reason) => {
    console.warn('Disconnected from dashboard:', reason);
  });

  socket.on('agent:wake', async ({ mac }) => {
    try {
      await triggerWake(mac);
      socket.emit('agent:wake:ack', { vanId: VAN_ID, ok: true, mac });
    } catch (err) {
      socket.emit('agent:wake:ack', { vanId: VAN_ID, ok: false, mac, error: String(err) });
    }
  });
}

async function pollKumaOnce() {
  const start = Date.now();
  try {
    const res = await axios.get(KUMA_URL, { timeout: 5000 });
    const latency = Date.now() - start;
    const status = res.status === 200 ? 'up' : 'down';
    const payload = {
      vanId: VAN_ID,
      status,
      uptime: status === 'up' ? 100 : 0,
      latency,
      timestamp: new Date().toISOString(),
    };
    if (socket && socket.connected) {
      socket.emit('agent:update', payload);
    }
    lastStatus = payload;
    return payload;
  } catch (err) {
    const latency = Date.now() - start;
    const payload = {
      vanId: VAN_ID,
      status: 'down',
      uptime: 0,
      latency,
      timestamp: new Date().toISOString(),
      error: String(err?.message || err),
    };
    if (socket && socket.connected) {
      socket.emit('agent:update', payload);
    }
    lastStatus = payload;
    return payload;
  }
}

async function triggerWake(mac) {
  return new Promise((resolve, reject) => {
    wol.wake(mac, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

app.get('/status', async (_req, res) => {
  const payload = await pollKumaOnce();
  res.json(payload);
});

app.post('/wake', async (req, res) => {
  const mac = req.body?.mac;
  if (!mac) return res.status(400).json({ error: 'mac is required' });
  try {
    await triggerWake(mac);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`uptime-agent listening on :${PORT}`);
  connectSocket();
  setInterval(pollKumaOnce, UPDATE_INTERVAL);
});



