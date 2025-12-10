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

export default function SRTStatusSection({ vanId }) {
  const [srtStatus, setSrtStatus] = useState({ connected: false, streamUrl: null, lastCheck: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSRTStatus() {
      try {
        // Check for SRT device in devices list
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${getApiBase()}/api/devices/latest?vanId=${encodeURIComponent(vanId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Look for SRT-related devices
        const srtDevices = Array.isArray(data) 
          ? data.filter(d => {
              const name = (d.name || '').toLowerCase();
              return name.includes('srt') || name.includes('stream') || name.includes('live');
            })
          : [];
        
        if (srtDevices.length > 0) {
          const srtDevice = srtDevices[0];
          setSrtStatus({
            connected: srtDevice.status === 'up',
            streamUrl: srtDevice.stream_url || null, // Adjust based on your data structure
            lastCheck: new Date(srtDevice.timestamp),
          });
        } else {
          // If no SRT device found, you might want to check a dedicated endpoint
          // For now, set as disconnected
          setSrtStatus({
            connected: false,
            streamUrl: null,
            lastCheck: new Date(),
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.warn('Failed to check SRT status:', err);
        setLoading(false);
      }
    }

    checkSRTStatus();
    
    // Check every 10 seconds
    const interval = setInterval(checkSRTStatus, 10000);
    return () => clearInterval(interval);
  }, [vanId]);

  // Also listen for device updates
  useEffect(() => {
    const handleDevices = (payload) => {
      if (payload.vanId !== vanId) return;
      const srtDevices = (payload.devices || []).filter(d => {
        const name = (d.name || '').toLowerCase();
        return name.includes('srt') || name.includes('stream') || name.includes('live');
      });
      
      if (srtDevices.length > 0) {
        const srtDevice = srtDevices[0];
        setSrtStatus({
          connected: srtDevice.status === 'up',
          streamUrl: srtDevice.stream_url || null,
          lastCheck: new Date(),
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
        <h2 className="text-xl font-semibold mb-4">SRT Live Stream</h2>
        <div className="text-gray-500">Checking SRT status...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="text-xl font-semibold mb-4">SRT Live Stream</h2>
      <div className="space-y-4">
        <div className={`p-4 rounded-lg border-2 ${srtStatus.connected ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Connection Status</div>
            <div className={`w-4 h-4 rounded-full ${srtStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          <div className={`text-lg font-semibold ${srtStatus.connected ? 'text-green-700' : 'text-red-700'}`}>
            {srtStatus.connected ? 'Connected' : 'Disconnected'}
          </div>
          {srtStatus.lastCheck && (
            <div className="text-xs text-gray-500 mt-2">
              Last checked: {srtStatus.lastCheck instanceof Date ? srtStatus.lastCheck.toLocaleTimeString() : new Date(srtStatus.lastCheck).toLocaleTimeString()}
            </div>
          )}
        </div>
        
        {srtStatus.streamUrl && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Stream URL</div>
            <div className="font-mono text-xs break-all">{srtStatus.streamUrl}</div>
            <a
              href={srtStatus.streamUrl}
              target="_blank"
              rel="noreferrer"
              className="block mt-2 px-3 py-1 bg-blue-600 text-white text-center rounded hover:bg-blue-700 transition text-sm"
            >
              Open Stream
            </a>
          </div>
        )}
        
        {!srtStatus.streamUrl && srtStatus.connected && (
          <div className="text-sm text-gray-500 text-center py-2">
            Stream URL not configured
          </div>
        )}
      </div>
    </div>
  );
}
