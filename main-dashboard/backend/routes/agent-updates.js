import express from 'express';

const router = express.Router();

// Endpoint for agents to push updates via REST (when WebSocket fails)
router.post('/update', async (req, res) => {
  const { vanId, status, uptime, latency, timestamp } = req.body || {};
  if (!vanId) return res.status(400).json({ error: 'vanId required' });
  
  const db = req.db;
  const io = req.app.locals.io;
  
  await db.run('INSERT INTO logs (van_id, status, uptime, latency, timestamp) VALUES (?, ?, ?, ?, ?)',
    vanId, status, uptime, latency, timestamp);
  await db.run('UPDATE vans SET status = ?, last_latency = ?, last_seen = ? WHERE id = ?',
    status, latency, Date.now(), vanId);
  
  io.emit('dashboard:update', { vanId, status, uptime, latency, timestamp });
  
  res.json({ ok: true });
});

router.post('/devices', async (req, res) => {
  const { vanId, devices, timestamp } = req.body || {};
  if (!vanId || !devices || !Array.isArray(devices)) return res.status(400).json({ error: 'vanId and devices required' });
  
  const db = req.db;
  const io = req.app.locals.io;
  
  for (const device of devices) {
    try {
      await db.run(
        'INSERT INTO devices (van_id, monitor_id, name, status, latency, timestamp) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(van_id, monitor_id, timestamp) DO NOTHING',
        vanId, device.monitorId, device.name, device.status, device.latency, device.timestamp
      );
    } catch (err) {
      console.warn('Failed to insert device:', err.message);
    }
  }
  
  io.emit('dashboard:devices', { vanId, devices, timestamp });
  
  res.json({ ok: true });
});

export default router;

