import express from 'express';
import http from 'http';
import axios from 'axios';
import { io as ioClient } from 'socket.io-client';
import wol from 'wake_on_lan';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '5000', 10);
const DASHBOARD_WS_URL = process.env.DASHBOARD_WS_URL || '';
const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || DASHBOARD_WS_URL || '';
const VAN_ID = process.env.VAN_ID || 'van-unknown';
const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL || '10000', 10);
const KUMA_URL = process.env.KUMA_URL || 'http://localhost:3001';
const KUMA_STATUS_PAGE_SLUG = process.env.KUMA_STATUS_PAGE_SLUG || 'ob1test';
const USE_REST_MODE = process.env.USE_REST_MODE === 'true';

let socket = null;
let lastStatus = null;

function connectSocket() {
  if (USE_REST_MODE) {
    console.log('REST mode enabled, skipping WebSocket connection');
    return;
  }
  if (!DASHBOARD_WS_URL) {
    console.warn('DASHBOARD_WS_URL not set, skipping socket connection');
    return;
  }
  console.log(`Connecting to dashboard at ${DASHBOARD_WS_URL}...`);
  socket = ioClient(DASHBOARD_WS_URL, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });

  socket.on('connect', async () => {
    console.log('✓ Connected to dashboard');
    
    // Auto-detect Kuma status page URL
    let kumaStatusUrl = null;
    try {
      const res = await axios.get(`${KUMA_URL}/api/status-page/heartbeat/${KUMA_STATUS_PAGE_SLUG}`, { timeout: 3000 });
      if (res.data) {
        // Build the public status page URL
        const kumaPublicUrl = process.env.KUMA_PUBLIC_URL || KUMA_URL.replace('http://kuma:', 'http://localhost:');
        kumaStatusUrl = `${kumaPublicUrl}/status-page/${KUMA_STATUS_PAGE_SLUG}`;
        console.log(`Detected Kuma status page: ${kumaStatusUrl}`);
      }
    } catch (err) {
      console.warn('Could not auto-detect Kuma status page:', err.message);
    }
    
    socket.emit('agent:hello', {
      vanId: VAN_ID,
      agentApiUrl: process.env.AGENT_PUBLIC_URL || null,
      kumaStatusUrl,
    });
    // Trigger immediate poll
    pollKumaOnce().catch(err => console.error('Initial poll failed:', err));
  });

  socket.on('disconnect', (reason) => {
    console.warn('✗ Disconnected from dashboard:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
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
    
    // Send via WebSocket if connected, otherwise REST API
    if (socket && socket.connected) {
      socket.emit('agent:update', payload);
    } else if (USE_REST_MODE && DASHBOARD_API_URL) {
      await axios.post(`${DASHBOARD_API_URL}/api/agent/update`, payload, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      }).catch(err => console.warn('REST update failed:', err.message));
    }
    
    lastStatus = payload;
    
    // Also fetch monitors/devices and send device-level updates
    await pollKumaMonitors();
    
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
    } else if (USE_REST_MODE && DASHBOARD_API_URL) {
      await axios.post(`${DASHBOARD_API_URL}/api/agent/update`, payload, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      }).catch(err => console.warn('REST update failed:', err.message));
    }
    
    lastStatus = payload;
    return payload;
  }
}

async function pollKumaMonitors() {
  try {
    // Fetch monitor list from Kuma API (this requires authentication or public API access)
    // For now, we'll use a simple heartbeat list endpoint if available
    // Note: Kuma's API may require auth; adjust as needed
    const res = await axios.get(`${KUMA_URL}/api/status-page/heartbeat/${KUMA_STATUS_PAGE_SLUG}`, { timeout: 5000 });
    if (res.data && res.data.heartbeatList) {
      const devices = Object.entries(res.data.heartbeatList).map(([monitorId, beats]) => {
        const latestBeat = beats && beats.length > 0 ? beats[beats.length - 1] : null;
        return {
          vanId: VAN_ID,
          monitorId: parseInt(monitorId, 10),
          name: res.data.publicGroupList?.find(g => g.monitorList?.some(m => m.id === parseInt(monitorId, 10)))?.monitorList?.find(m => m.id === parseInt(monitorId, 10))?.name || `Device ${monitorId}`,
          status: latestBeat?.status === 1 ? 'up' : 'down',
          latency: latestBeat?.ping || 0,
          timestamp: new Date().toISOString(),
        };
      });
      
      const devicesPayload = { vanId: VAN_ID, devices, timestamp: new Date().toISOString() };
      
      if (socket && socket.connected && devices.length > 0) {
        socket.emit('agent:devices', devicesPayload);
      } else if (USE_REST_MODE && DASHBOARD_API_URL && devices.length > 0) {
        await axios.post(`${DASHBOARD_API_URL}/api/agent/devices`, devicesPayload, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        }).catch(err => console.warn('REST devices update failed:', err.message));
      }
    }
  } catch (err) {
    console.warn('Failed to poll Kuma monitors:', err.message);
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



