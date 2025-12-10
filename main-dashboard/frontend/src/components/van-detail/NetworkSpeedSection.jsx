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

// NetworkSpeedSection: Displays network speed data from the agent (van)
// Data flow: Agent (van) → Prometheus → Backend API → Frontend
export default function NetworkSpeedSection({ vanId }) {
  const [speedtestData, setSpeedtestData] = useState([]);
  const [currentStats, setCurrentStats] = useState({ download: null, upload: null, ping: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSpeedtestData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [historyRes, currentRes] = await Promise.all([
        axios.get(`${getApiBase()}/api/metrics/speedtest`, {
          params: { vanId, range: '1h' },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${getApiBase()}/api/metrics/current`, {
          params: { vanId },
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Transform history data for chart
      const chartData = Array.isArray(historyRes.data) ? historyRes.data.map(item => ({
        time: new Date(item.timestamp * 1000).toLocaleTimeString(),
        timestamp: item.timestamp,
        download: item.download || 0,
        upload: item.upload || 0,
        ping: item.ping || 0,
      })) : [];

      setSpeedtestData(chartData);
      setCurrentStats(currentRes.data || { download: null, upload: null, ping: null });
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch speedtest data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!vanId) return;
    
    // Fetch immediately on mount
    fetchSpeedtestData();
    
    // Refresh every 30 seconds to get latest data from agent
    const interval = setInterval(() => {
      fetchSpeedtestData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [vanId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Network Speed Monitoring</h2>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Network Speed Monitoring</h2>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const hasData = speedtestData.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Network Speed Monitoring</h2>
      
      {/* Current Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="text-sm text-gray-600 mb-1">Current Download</div>
          <div className="text-2xl font-bold text-blue-600">
            {currentStats.download !== null && currentStats.download !== undefined 
              ? `${currentStats.download.toFixed(2)} Mbps` 
              : 'N/A'}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <div className="text-sm text-gray-600 mb-1">Current Upload</div>
          <div className="text-2xl font-bold text-green-600">
            {currentStats.upload !== null && currentStats.upload !== undefined 
              ? `${currentStats.upload.toFixed(2)} Mbps` 
              : 'N/A'}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
          <div className="text-sm text-gray-600 mb-1">Current Ping</div>
          <div className="text-2xl font-bold text-purple-600">
            {currentStats.ping !== null && currentStats.ping !== undefined 
              ? `${currentStats.ping.toFixed(0)} ms` 
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Speedtest Charts */}
      {hasData ? (
        <div className="space-y-6">
          {/* Download/Upload Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Internet Speed (Speedtest)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={speedtestData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
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

          {/* Ping Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Ping Latency</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={speedtestData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  label={{ value: 'ms', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ping" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Ping (ms)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No speedtest data available yet.</p>
          <p className="text-sm mt-2">Data will appear here once speedtest metrics are collected.</p>
        </div>
      )}
    </div>
  );
}
