import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import DeviceCharts from '../components/DeviceCharts.jsx';
import { socket } from '../sockets.js';

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

export default function Vans() {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState({});

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.get(`${getApiBase()}/api/vans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load vans:', err);
      setRows([]);
    }
  }, []);

  useEffect(() => { 
    load();
    
    // Listen for van updates without reloading entire list
    const handleVanUpdate = (payload) => {
      setRows(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(v => 
          v.id === payload.vanId 
            ? { ...v, status: payload.status, last_latency: payload.latency, last_seen: Date.now() }
            : v
        );
      });
    };
    
    socket.on('dashboard:update', handleVanUpdate);
    return () => {
      socket.off('dashboard:update', handleVanUpdate);
    };
  }, [load]);

  async function wake(id) {
    const token = localStorage.getItem('token');
    await axios.post(`${getApiBase()}/api/vans/${id}/wake`, {}, { headers: { Authorization: `Bearer ${token}` } });
    alert('Wake requested');
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Vans & Devices</h1>
      <div className="space-y-4">
        {Array.isArray(rows) && rows.map((v) => (
          <div key={v.id} className="bg-white rounded border">
            <div className="p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{v.name} ({v.id})</div>
                <div className="text-sm text-gray-600">Status: {v.status || 'unknown'} • Latency: {v.last_latency ?? '-'}ms • MAC: {v.mac || '-'}</div>
                <div className="text-sm mt-1 flex gap-2">
                  <button
                    className="text-blue-700 underline"
                    onClick={() => toggleExpand(v.id)}
                  >
                    {expanded[v.id] ? 'Hide' : 'Show'} Devices
                  </button>
                  {v.kuma_status_url && (
                    <a className="text-blue-700 underline" href={v.kuma_status_url} target="_blank" rel="noreferrer">Open Kuma</a>
                  )}
                </div>
              </div>
              <button
                className={`px-3 py-1 rounded ${v.mac ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                onClick={() => v.mac && wake(v.id)}
                disabled={!v.mac}
              >
                Wake
              </button>
            </div>
            {expanded[v.id] && (
              <div className="border-t p-4">
                <DeviceCharts key={`devices-${v.id}`} vanId={v.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


