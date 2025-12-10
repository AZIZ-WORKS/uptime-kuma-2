import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

export default function NetworkHealthSection({ vanId }) {
  const [networkData, setNetworkData] = useState([]);
  const [currentStats, setCurrentStats] = useState({ download: null, upload: null, ping: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNetworkHealth() {
      const token = localStorage.getItem('token');
      try {
        // Get current network stats
        const currentRes = await axios.get(`${getApiBase()}/api/metrics/current?vanId=${encodeURIComponent(vanId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentStats(currentRes.data || {});

        // Get interface bandwidth data
        const interfaceRes = await axios.get(`${getApiBase()}/api/metrics/interfaces?vanId=${encodeURIComponent(vanId)}&range=5m`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Convert interface data to chart format
        const interfaces = interfaceRes.data || {};
        const chartData = [];
        const timeMap = new Map();
        
        Object.entries(interfaces).forEach(([interfaceName, data]) => {
          data.forEach(point => {
            const timestamp = point.timestamp * 1000; // Convert to milliseconds
            if (!timeMap.has(timestamp)) {
              timeMap.set(timestamp, { time: new Date(timestamp).toLocaleTimeString() });
            }
            const entry = timeMap.get(timestamp);
            entry[`${interfaceName} - Download`] = point.download_mbps || 0;
            entry[`${interfaceName} - Upload`] = point.upload_mbps || 0;
          });
        });
        
        setNetworkData(Array.from(timeMap.values()).sort((a, b) => a.time.localeCompare(b.time)));
        setLoading(false);
      } catch (err) {
        console.warn('Failed to load network health:', err);
        setLoading(false);
      }
    }

    loadNetworkHealth();
    
    // Refresh every 15 seconds
    const interval = setInterval(loadNetworkHealth, 15000);
    return () => clearInterval(interval);
  }, [vanId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Network Health</h2>
        <div className="text-gray-500">Loading network data...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Network Health (OPNsense)</h2>
      
      {/* Current Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Download</div>
          <div className="text-lg font-bold text-blue-700">
            {currentStats.download !== null ? `${currentStats.download.toFixed(1)} Mbps` : '--'}
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs text-gray-600 mb-1">Upload</div>
          <div className="text-lg font-bold text-green-700">
            {currentStats.upload !== null ? `${currentStats.upload.toFixed(1)} Mbps` : '--'}
          </div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-xs text-gray-600 mb-1">Ping</div>
          <div className="text-lg font-bold text-purple-700">
            {currentStats.ping !== null ? `${currentStats.ping.toFixed(0)} ms` : '--'}
          </div>
        </div>
      </div>

      {/* Interface Bandwidth Chart */}
      {networkData.length > 0 ? (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Interface Bandwidth (Last 5 min)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={networkData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {Object.keys(networkData[0] || {})
                .filter(key => key !== 'time' && key.includes('Download'))
                .map((key, idx) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={`hsl(${idx * 60}, 70%, 50%)`} dot={false} />
                ))}
              {Object.keys(networkData[0] || {})
                .filter(key => key !== 'time' && key.includes('Upload'))
                .map((key, idx) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={`hsl(${idx * 60 + 180}, 70%, 50%)`} strokeDasharray="5 5" dot={false} />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-gray-500 text-center py-4 text-sm">No network interface data available</div>
      )}
    </div>
  );
}
