import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.get(`${getApiBase()}/api/vans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.warn('Failed to load vans:', err);
      setRows([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // Listen for van updates
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
    try {
      await axios.post(`${getApiBase()}/api/vans/${id}/wake`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Wake signal sent');
    } catch (err) {
      alert('Failed to send wake signal');
    }
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading vans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Vans & Devices</h1>
      </div>

      {rows.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800 font-medium">No vans found</p>
          <p className="text-yellow-700 text-sm mt-1">Make sure agents are connected and configured.</p>
        </div>
      )}

      <div className="space-y-4">
        {Array.isArray(rows) && rows.map((v) => (
          <div key={v.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Link
                      to={`/vans/${v.id}`}
                      className="text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {v.name || v.id}
                    </Link>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        v.status === 'up'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {v.status === 'up' ? '● Online' : '● Offline'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>ID: <span className="font-mono">{v.id}</span></span>
                    {v.last_latency && <span>Latency: <span className="font-semibold">{v.last_latency}ms</span></span>}
                    {v.mac && <span>MAC: <span className="font-mono">{v.mac}</span></span>}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      to={`/vans/${v.id}`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Dashboard
                    </Link>
                    <button
                      onClick={() => toggleExpand(v.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {expanded[v.id] ? 'Hide' : 'Show'} Devices
                    </button>
                    {v.kuma_status_url && (
                      <a
                        href={v.kuma_status_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Open Kuma Status
                      </a>
                    )}
                    {v.mac && (
                      <button
                        onClick={() => wake(v.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Wake
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {expanded[v.id] && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <DeviceCharts key={`devices-${v.id}`} vanId={v.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
