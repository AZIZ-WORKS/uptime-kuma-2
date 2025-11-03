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
    ORDER BY d1.monitor_id
  `, vanId);
  
  res.json(rows);
});

export default router;

