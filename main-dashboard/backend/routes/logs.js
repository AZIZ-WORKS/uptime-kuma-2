import express from 'express';
import { requireAuth } from '../utils/auth.js';

const router = express.Router();

router.get('/', requireAuth(['admin', 'engineer', 'viewer']), async (req, res) => {
  const { vanId, limit = 200 } = req.query;
  const rows = await req.db.all(
    vanId
      ? 'SELECT * FROM logs WHERE van_id = ? ORDER BY timestamp DESC LIMIT ?'
      : 'SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?',
    vanId ? [vanId, limit] : [limit]
  );
  res.json(rows);
});

export default router;



