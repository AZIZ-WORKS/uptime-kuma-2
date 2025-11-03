import express from 'express';
import { requireAuth } from '../utils/auth.js';
import { emitWake } from '../sockets.js';

const router = express.Router();

router.get('/', requireAuth(['admin', 'engineer', 'viewer']), async (req, res) => {
  const rows = await req.db.all('SELECT id, name, mac, status, last_latency, last_seen, agent_api_url, kuma_status_url FROM vans ORDER BY id');
  res.json(rows);
});

router.post('/', requireAuth(['admin']), async (req, res) => {
  const { id, name, mac, kuma_status_url } = req.body || {};
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });
  await req.db.run('INSERT INTO vans (id, name, mac, status, kuma_status_url) VALUES (?, ?, ?, ?, ?)', id, name, mac || null, 'unknown', kuma_status_url || null);
  res.json({ ok: true });
});

router.put('/:id', requireAuth(['admin']), async (req, res) => {
  const { name, mac, kuma_status_url } = req.body || {};
  await req.db.run('UPDATE vans SET name = ?, mac = ?, kuma_status_url = ? WHERE id = ?', name, mac || null, kuma_status_url || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  await req.db.run('DELETE FROM vans WHERE id = ?', req.params.id);
  res.json({ ok: true });
});

router.post('/:id/wake', requireAuth(['admin', 'engineer']), async (req, res) => {
  const van = await req.db.get('SELECT id, mac, agent_api_url FROM vans WHERE id = ?', req.params.id);
  if (!van) return res.status(404).json({ error: 'van not found' });
  if (!van.mac) return res.status(400).json({ error: 'van mac not set' });
  // Prefer direct call to agent if agent_api_url known; otherwise broadcast over sockets layer in future
  try {
    if (van.agent_api_url) {
      const resp = await fetch(`${van.agent_api_url}/wake`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mac: van.mac }) });
      const body = await resp.json();
      if (!resp.ok) return res.status(502).json({ error: body?.error || 'wake failed' });
      return res.json({ ok: true });
    }
    const ok = emitWake(req.app.locals.io, req.params.id, van.mac);
    if (!ok) return res.status(503).json({ ok: false, error: 'agent socket not connected' });
    return res.json({ ok: true, via: 'socket' });
  } catch (err) {
    return res.status(502).json({ ok: false, error: String(err) });
  }
});

export default router;


