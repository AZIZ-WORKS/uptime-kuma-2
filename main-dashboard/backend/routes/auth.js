import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/login', async (req, res) => {
  const db = req.db;
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const user = await db.get('SELECT id, username, password_hash, role FROM users WHERE username = ?', username);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ sub: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '12h' });
  res.json({ token, role: user.role, username: user.username });
});

export default router;



