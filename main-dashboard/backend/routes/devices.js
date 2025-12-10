import express from 'express';
import { requireAuth } from '../utils/auth.js';

const router = express.Router();

router.get('/', requireAuth(['admin', 'engineer', 'viewer']), async (req, res) => {
  const { vanId, limit = 200 } = req.query;
  const rows = await req.db.all(
    vanId
      ? 'SELECT * FROM devices WHERE van_id = ? ORDER BY timestamp DESC LIMIT ?'
      : 'SELECT * FROM devices ORDER BY timestamp DESC LIMIT ?',
    vanId ? [vanId, limit] : [limit]
  );
  res.json(rows);
});

router.get('/latest', requireAuth(['admin', 'engineer', 'viewer']), async (req, res) => {
  const { vanId } = req.query;
  if (!vanId) return res.status(400).json({ error: 'vanId required' });
  
  // Get latest status for each monitor in this van
  const rows = await req.db.all(`
    SELECT d1.* FROM devices d1
    INNER JOIN (
      SELECT van_id, monitor_id, MAX(timestamp) as max_ts
      FROM devices
      WHERE van_id = ?
      GROUP BY van_id, monitor_id
    ) d2 ON d1.van_id = d2.van_id AND d1.monitor_id = d2.monitor_id AND d1.timestamp = d2.max_ts
    ORDER BY d1.name, d1.monitor_id
  `, vanId);
  
  res.json(rows);
});

// Fetch devices directly from Uptime Kuma status page API
router.get('/from-kuma', requireAuth(['admin', 'engineer', 'viewer']), async (req, res) => {
  const { vanId, kumaStatusUrl } = req.query;
  
  if (!vanId) {
    return res.status(400).json({ error: 'vanId required' });
  }
  
  // Get kuma_status_url from van if not provided
  let kumaUrl = kumaStatusUrl;
  if (!kumaUrl) {
    const van = await req.db.get('SELECT kuma_status_url FROM vans WHERE id = ?', vanId);
    if (!van || !van.kuma_status_url) {
      return res.status(404).json({ error: 'Kuma status URL not found for this van' });
    }
    kumaUrl = van.kuma_status_url;
  }
  
  try {
    // Extract status page slug from URL (e.g., https://kuma.example.com/status/ob1test -> ob1test)
    const urlMatch = kumaUrl.match(/\/status\/([^\/\?]+)/);
    if (!urlMatch) {
      return res.status(400).json({ error: 'Invalid Kuma status URL format' });
    }
    
    const statusPageSlug = urlMatch[1];
    const baseUrl = kumaUrl.split('/status/')[0];
    const apiUrl = `${baseUrl}/api/status-page/heartbeat/${statusPageSlug}`;
    
    // Fetch from Kuma API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'BFA-Monitoring-Dashboard/1.0',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Kuma API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Parse heartbeat data into device list
    const devices = [];
    const monitorNames = {};
    
    // Extract monitor names from publicGroupList
    if (data.publicGroupList && Array.isArray(data.publicGroupList)) {
      data.publicGroupList.forEach(group => {
        if (group.monitorList && Array.isArray(group.monitorList)) {
          group.monitorList.forEach(monitor => {
            monitorNames[monitor.id] = monitor.name || monitor.pathName || `Monitor ${monitor.id}`;
          });
        }
      });
    }
    
    // Parse heartbeatList
    if (data.heartbeatList && typeof data.heartbeatList === 'object') {
      Object.entries(data.heartbeatList).forEach(([monitorId, beats]) => {
        const id = parseInt(monitorId, 10);
        if (!isNaN(id) && Array.isArray(beats) && beats.length > 0) {
          const latestBeat = beats[beats.length - 1];
          devices.push({
            monitorId: id,
            name: monitorNames[id] || `Device ${id}`,
            status: latestBeat.status === 1 ? 'up' : 'down',
            latency: latestBeat.ping || 0,
            timestamp: latestBeat.time * 1000, // Convert to milliseconds
          });
        }
      });
    }
    
    res.json(devices);
  } catch (err) {
    console.error('Failed to fetch devices from Kuma:', err);
    res.status(500).json({ error: `Failed to fetch devices from Kuma: ${err.message}` });
  }
});

export default router;

