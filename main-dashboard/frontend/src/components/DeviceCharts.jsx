import React, { useEffect, useState } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import { socket } from '../sockets.js';

function getApiBase() {
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

export default function DeviceCharts({ vanId }) {
  const [devices, setDevices] = useState([]);
  const [history, setHistory] = useState({});

  useEffect(() => {
    async function loadLatest() {
      const token = localStorage.getItem('token');
      try {
        const { data } = await axios.get(`${getApiBase()}/api/devices/latest?vanId=${encodeURIComponent(vanId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDevices(data);
      } catch (err) {
        console.warn('Failed to load devices:', err);
      }
    }

    async function loadHistory() {
      const token = localStorage.getItem('token');
      try {
        const { data } = await axios.get(`${getApiBase()}/api/devices?vanId=${encodeURIComponent(vanId)}&limit=500`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Group by monitor_id
        const grouped = {};
        data.reverse().forEach((d) => {
          if (!grouped[d.monitor_id]) grouped[d.monitor_id] = [];
          grouped[d.monitor_id].push(d);
        });
        setHistory(grouped);
      } catch (err) {
        console.warn('Failed to load device history:', err);
      }
    }

    loadLatest();
    loadHistory();

    const handleDevices = (payload) => {
      if (payload.vanId !== vanId) return;
      setDevices(payload.devices || []);
      
      // Append to history
      setHistory((prev) => {
        const updated = { ...prev };
        (payload.devices || []).forEach((d) => {
          if (!updated[d.monitorId]) updated[d.monitorId] = [];
          updated[d.monitorId] = [...updated[d.monitorId], d].slice(-100);
        });
        return updated;
      });
    };

    socket.on('dashboard:devices', handleDevices);
    return () => {
      socket.off('dashboard:devices', handleDevices);
    };
  }, [vanId]);

  if (devices.length === 0) {
    return <div className="text-gray-500 text-sm">No devices found for this van</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Devices ({devices.length})</h2>
      
      {/* Current status cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((d) => (
          <div key={d.monitor_id} className="bg-white p-3 rounded border">
            <div className="flex items-center justify-between">
              <div className="font-medium">{d.name}</div>
              <div className={`text-sm ${d.status === 'up' ? 'text-green-700' : 'text-red-700'}`}>
                {d.status === 'up' ? 'Online' : 'Offline'}
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-1">Latency: {d.latency}ms</div>
            <div className="text-xs text-gray-500">{new Date(d.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Latency charts for each device */}
      {devices.map((d) => {
        const chartData = history[d.monitor_id] || [];
        if (chartData.length === 0) return null;
        
        return (
          <div key={`chart-${d.monitor_id}`} className="bg-white p-4 rounded border">
            <div className="font-medium mb-2">{d.name} - Latency Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" hide />
                <YAxis />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                <Legend />
                <Line type="monotone" dataKey="latency" stroke="#2563eb" name="Latency (ms)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}

