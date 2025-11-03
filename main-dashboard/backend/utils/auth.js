import jwt from 'jsonwebtoken';

export function requireAuth(roles = []) {
  return (req, res, next) => {
    try {
      const hdr = req.headers.authorization || '';
      const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'missing token' });
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      req.user = payload;
      if (roles.length && !roles.includes(payload.role)) return res.status(403).json({ error: 'forbidden' });
      next();
    } catch (err) {
      return res.status(401).json({ error: 'invalid token' });
    }
  };
}



