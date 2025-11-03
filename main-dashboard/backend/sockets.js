const registry = {
  vanToSocketId: new Map(),
  set(vanId, socketId) { this.vanToSocketId.set(vanId, socketId); },
  deleteBySocket(socketId) {
    for (const [vanId, sid] of this.vanToSocketId.entries()) {
      if (sid === socketId) this.vanToSocketId.delete(vanId);
    }
  },
  getSocketId(vanId) { return this.vanToSocketId.get(vanId) || null; },
};

export function emitWake(io, vanId, mac) {
  const sid = registry.getSocketId(vanId);
  if (!sid) return false;
  io.to(sid).emit('agent:wake', { mac });
  return true;
}

export default function registerSockets(io, getDb) {
  io.on('connection', (socket) => {
    socket.on('agent:hello', async (data) => {
      const db = getDb();
      const { vanId, agentApiUrl } = data || {};
      if (!vanId) return;
      registry.set(vanId, socket.id);
      await db.run('UPDATE vans SET last_seen = ?, agent_api_url = ? WHERE id = ?', Date.now(), agentApiUrl || null, vanId);
      io.emit('dashboard:van_seen', { vanId, agentApiUrl, at: new Date().toISOString() });
    });

    socket.on('agent:update', async (payload) => {
      const db = getDb();
      const { vanId, status, uptime, latency, timestamp } = payload || {};
      if (!vanId) return;
      await db.run('INSERT INTO logs (van_id, status, uptime, latency, timestamp) VALUES (?, ?, ?, ?, ?)',
        vanId, status, uptime, latency, timestamp);
      await db.run('UPDATE vans SET status = ?, last_latency = ?, last_seen = ? WHERE id = ?',
        status, latency, Date.now(), vanId);
      io.emit('dashboard:update', payload);
    });

    socket.on('disconnect', () => {
      registry.deleteBySocket(socket.id);
    });
  });
}

export { registry };


