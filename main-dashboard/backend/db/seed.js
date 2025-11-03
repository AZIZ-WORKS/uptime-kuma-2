import bcrypt from 'bcrypt';

export default async function seed(db) {
  const admin = await db.get('SELECT id FROM users WHERE username = ?', 'admin');
  if (!admin) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await db.run('INSERT INTO users (username, password_hash, role) VALUES (?,?,?)', 'admin', hash, 'admin');
  }
  // Ensure at least one van example exists
  const van = await db.get('SELECT id FROM vans WHERE id = ?', 'van1');
  if (!van) {
    await db.run('INSERT INTO vans (id, name, status) VALUES (?,?,?)', 'van1', 'Demo Van', 'unknown');
  }
}



