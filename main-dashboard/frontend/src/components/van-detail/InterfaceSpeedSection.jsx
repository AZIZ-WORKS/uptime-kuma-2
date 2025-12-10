import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

export default function InterfaceSpeedSection({ vanId }) {
  const [interfaceData, setInterfaceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInterfaceData = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${getApiBase()}/api/metrics/interfaces`, {
        params: { vanId, range: '5m' },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Transform data for charts
      const transformed = {};
      Object.keys(res.data).forEach(interfaceName => {
        transformed[interfaceName] = res.data[interfaceName].map(item => ({
          time: new Date(item.timestamp * 1000).toLocaleTimeString(),
          timestamp: item.timestamp,
          download: item.download_mbps || 0,
          upload: item.upload_mbps || 0,
        }));
      });

      setInterfaceData(transformed);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch interface data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!vanId) return;
    
    fetchInterfaceData();
    const interval = setInterval(fetchInterfaceData, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(interval);
  }, [vanId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Interface Bandwidth (Real-time)</h2>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Interface Bandwidth (Real-time)</h2>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const interfaces = Object.keys(interfaceData);
  
  if (interfaces.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Interface Bandwidth (Real-time)</h2>
        <div className="text-gray-500">No interface data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Interface Bandwidth (Real-time)</h2>
      
      <div className="space-y-6">
        {interfaces.map(interfaceName => (
          <div key={interfaceName}>
            <h3 className="text-lg font-semibold mb-2">{interfaceName}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={interfaceData[interfaceName]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="download" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Download (Mbps)"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="upload" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Upload (Mbps)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
