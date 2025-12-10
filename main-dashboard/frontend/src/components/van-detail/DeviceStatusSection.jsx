import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { socket } from '../../sockets.js';

function getApiBase() {
  const stored = localStorage.getItem('BACKEND_URL');
  if (stored) return stored;
  const env = import.meta.env.VITE_API_URL;
  if (env) return env;
  try {
    const u = new URL(window.location.origin);
    if (u.port === '5173') u.port = '4000';
    return u.origin;
  } catch (_) {
    return 'http://localhost:4000';
  }
}

export default function DeviceStatusSection({ vanId }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLatest() {
      const token = localStorage.getItem('token');
      try {
        const { data } = await axios.get(`${getApiBase()}/api/devices/latest?vanId=${encodeURIComponent(vanId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDevices(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.warn('Failed to load devices:', err);
        setLoading(false);
      }
    }

    loadLatest();

    const handleDevices = (payload) => {
      if (payload.vanId !== vanId) return;
      setDevices(prev => {
        const newDevices = payload.devices || [];
        if (newDevices.length === 0) return prev;
        if (!Array.isArray(prev)) prev = [];
        const deviceMap = new Map(prev.map(d => [d.monitorId || d.monitor_id, d]));
        newDevices.forEach(d => {
          deviceMap.set(d.monitorId, d);
        });
        return Array.from(deviceMap.values());
      });
    };

    socket.on('dashboard:devices', handleDevices);
    return () => {
      socket.off('dashboard:devices', handleDevices);
    };
  }, [vanId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Uptime Kuma Devices</h2>
        <div className="text-gray-500">Loading devices...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Uptime Kuma Devices ({devices.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {devices.length === 0 ? (
          <div className="col-span-full text-gray-500 text-center py-4">No devices found</div>
        ) : (
          devices.map((d) => {
            const monId = d.monitorId || d.monitor_id;
            const isOnline = d.status === 'up';
            return (
              <div
                key={`device-${monId}`}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isOnline ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">{d.name}</div>
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="text-xs text-gray-600">
                  <div>Status: <span className={`font-semibold ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
                    {isOnline ? 'Connected' : 'Disconnected'}
                  </span></div>
                  <div className="mt-1">Latency: {d.latency || 0}ms</div>
                  <div className="mt-1 text-gray-500">{new Date(d.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
