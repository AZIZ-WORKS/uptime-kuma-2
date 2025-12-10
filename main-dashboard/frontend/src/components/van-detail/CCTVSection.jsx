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

export default function CCTVSection({ vanId }) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCameras() {
      const token = localStorage.getItem('token');
      try {
        // Filter devices that are CCTV cameras (you may need to adjust this logic)
        const { data } = await axios.get(`${getApiBase()}/api/devices/latest?vanId=${encodeURIComponent(vanId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Filter for CCTV cameras - adjust name matching as needed
        const cctvDevices = Array.isArray(data) 
          ? data.filter(d => {
              const name = (d.name || '').toLowerCase();
              return name.includes('cctv') || name.includes('camera') || name.includes('cam');
            })
          : [];
        
        setCameras(cctvDevices);
        setLoading(false);
      } catch (err) {
        console.warn('Failed to load cameras:', err);
        setLoading(false);
      }
    }

    loadCameras();

    const handleDevices = (payload) => {
      if (payload.vanId !== vanId) return;
      const cctvDevices = (payload.devices || []).filter(d => {
        const name = (d.name || '').toLowerCase();
        return name.includes('cctv') || name.includes('camera') || name.includes('cam');
      });
      if (cctvDevices.length > 0) {
        setCameras(prev => {
          const deviceMap = new Map(prev.map(d => [d.monitorId || d.monitor_id, d]));
          cctvDevices.forEach(d => {
            deviceMap.set(d.monitorId, d);
          });
          return Array.from(deviceMap.values());
        });
      }
    };

    socket.on('dashboard:devices', handleDevices);
    return () => {
      socket.off('dashboard:devices', handleDevices);
    };
  }, [vanId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">CCTV Cameras</h2>
        <div className="text-gray-500">Loading cameras...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="text-xl font-semibold mb-4">CCTV Cameras ({cameras.length})</h2>
      {cameras.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No CCTV cameras found</div>
      ) : (
        <div className="space-y-3">
          {cameras.map((cam) => {
            const monId = cam.monitorId || cam.monitor_id;
            const isOnline = cam.status === 'up';
            return (
              <div
                key={`camera-${monId}`}
                className={`p-4 rounded-lg border-2 ${
                  isOnline ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{cam.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Status: <span className={`font-semibold ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Latency: {cam.latency || 0}ms</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
