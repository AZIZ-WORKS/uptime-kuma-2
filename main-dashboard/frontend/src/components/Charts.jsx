import React, { useEffect, useState } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

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

export default function Charts({ vanId }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${getApiBase()}/api/logs?vanId=${encodeURIComponent(vanId)}&limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      setRows(data.reverse());
    })();
  }, [vanId]);

  return (
    <div className="bg-white p-4 rounded border">
      <div className="font-medium mb-2">Latency Trend</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={rows} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" hide />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="latency" stroke="#2563eb" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}



