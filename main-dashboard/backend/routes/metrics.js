import express from 'express';
import { requireAuth } from '../utils/auth.js';

const router = express.Router();

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://prometheus:9090';

// Helper to query Prometheus
async function queryPrometheus(query, start, end, step = '15s') {
  try {
    const url = new URL(`${PROMETHEUS_URL}/api/v1/query_range`);
    url.searchParams.append('query', query);
    url.searchParams.append('start', start);
    url.searchParams.append('end', end);
    url.searchParams.append('step', step);
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Prometheus query failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data?.result || [];
  } catch (err) {
    console.error('Prometheus query error:', err);
    return [];
  }
}

// Helper to query current instant value
async function queryPrometheusInstant(query) {
  try {
    const url = new URL(`${PROMETHEUS_URL}/api/v1/query`);
    url.searchParams.append('query', query);
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Prometheus query failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data?.result || [];
  } catch (err) {
    console.error('Prometheus instant query error:', err);
    return [];
  }
}

// Parse time range (e.g., '1h', '30m', '1d')
function parseTimeRange(range) {
  const now = Math.floor(Date.now() / 1000);
  const units = {
    'm': 60,
    'h': 3600,
    'd': 86400
  };
  
  const match = range.match(/^(\d+)([mhd])$/);
  if (!match) return { start: now - 3600, end: now }; // default 1h
  
  const [, amount, unit] = match;
  const seconds = parseInt(amount) * units[unit];
  return { start: now - seconds, end: now };
}

// Get speedtest data (download/upload/ping)
router.get('/speedtest', requireAuth(['admin', 'engineer', 'viewer']), async (req, res) => {
  const { vanId, range = '1h' } = req.query;
  
  if (!vanId) {
    return res.status(400).json({ error: 'vanId required' });
  }
  
  const { start, end } = parseTimeRange(range);
  
  try {
    const [downloadResult, uploadResult, pingResult] = await Promise.all([
      queryPrometheus(`van_speedtest_download_mbps{van_id="${vanId}"}`, start, end, '1m'),
      queryPrometheus(`van_speedtest_upload_mbps{van_id="${vanId}"}`, start, end, '1m'),
      queryPrometheus(`van_speedtest_ping_ms{van_id="${vanId}"}`, start, end, '1m')
    ]);
    
    // Merge results by timestamp
    const dataMap = new Map();
    
    downloadResult[0]?.values?.forEach(([timestamp, value]) => {
      dataMap.set(timestamp, { timestamp, download: parseFloat(value) });
    });
    
    uploadResult[0]?.values?.forEach(([timestamp, value]) => {
      const entry = dataMap.get(timestamp) || { timestamp };
      entry.upload = parseFloat(value);
      dataMap.set(timestamp, entry);
    });
    
    pingResult[0]?.values?.forEach(([timestamp, value]) => {
      const entry = dataMap.get(timestamp) || { timestamp };
      entry.ping = parseFloat(value);
      dataMap.set(timestamp, entry);
    });
    
    const data = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    
    res.json(data);
  } catch (err) {
    console.error('Failed to fetch speedtest metrics:', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get per-interface bandwidth data
router.get('/interfaces', requireAuth(['admin', 'engineer', 'viewer']), async (req, res) => {
  const { vanId, range = '5m' } = req.query;
  
  if (!vanId) {
    return res.status(400).json({ error: 'vanId required' });
  }
  
  const { start, end } = parseTimeRange(range);
  
  try {
    const [downloadResult, uploadResult] = await Promise.all([
      queryPrometheus(`van_interface_download_mbps{van_id="${vanId}"}`, start, end, '5s'),
      queryPrometheus(`van_interface_upload_mbps{van_id="${vanId}"}`, start, end, '5s')
    ]);
    
    // Group by interface
    const interfaces = {};
    
    downloadResult.forEach((series) => {
      const interfaceName = series.metric.interface || 'unknown';
      const ip = series.metric.ip || '';
      const key = `${interfaceName} (${ip})`;
      
      if (!interfaces[key]) {
        interfaces[key] = [];
      }
      
      series.values.forEach(([timestamp, value]) => {
        const existing = interfaces[key].find(d => d.timestamp === timestamp);
        if (existing) {
          existing.download_mbps = parseFloat(value);
        } else {
          interfaces[key].push({
            timestamp,
            download_mbps: parseFloat(value),
            upload_mbps: 0
          });
        }
      });
    });
    
    uploadResult.forEach((series) => {
      const interfaceName = series.metric.interface || 'unknown';
      const ip = series.metric.ip || '';
      const key = `${interfaceName} (${ip})`;
      
      if (!interfaces[key]) {
        interfaces[key] = [];
      }
      
      series.values.forEach(([timestamp, value]) => {
        const existing = interfaces[key].find(d => d.timestamp === timestamp);
        if (existing) {
          existing.upload_mbps = parseFloat(value);
        } else {
          interfaces[key].push({
            timestamp,
            download_mbps: 0,
            upload_mbps: parseFloat(value)
          });
        }
      });
    });
    
    // Sort each interface's data by timestamp
    Object.keys(interfaces).forEach(key => {
      interfaces[key].sort((a, b) => a.timestamp - b.timestamp);
    });
    
    res.json(interfaces);
  } catch (err) {
    console.error('Failed to fetch interface metrics:', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get current/latest values
router.get('/current', requireAuth(['admin', 'engineer', 'viewer']), async (req, res) => {
  const { vanId } = req.query;
  
  if (!vanId) {
    return res.status(400).json({ error: 'vanId required' });
  }
  
  try {
    const [downloadResult, uploadResult, pingResult] = await Promise.all([
      queryPrometheusInstant(`van_speedtest_download_mbps{van_id="${vanId}"}`),
      queryPrometheusInstant(`van_speedtest_upload_mbps{van_id="${vanId}"}`),
      queryPrometheusInstant(`van_speedtest_ping_ms{van_id="${vanId}"}`)
    ]);
    
    const current = {
      download: downloadResult[0]?.value?.[1] ? parseFloat(downloadResult[0].value[1]) : null,
      upload: uploadResult[0]?.value?.[1] ? parseFloat(uploadResult[0].value[1]) : null,
      ping: pingResult[0]?.value?.[1] ? parseFloat(pingResult[0].value[1]) : null,
    };
    
    res.json(current);
  } catch (err) {
    console.error('Failed to fetch current metrics:', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;





