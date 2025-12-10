import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

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

// Format timestamp for display
function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString();
}

export default function NetworkCharts({ vanId }) {
  const [speedData, setSpeedData] = useState([]);
  const [interfaceData, setInterfaceData] = useState({});
  const [currentStats, setCurrentStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from Prometheus via backend proxy
  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = getApiBase();
      
      // Fetch speedtest metrics (last 1 hour)
      const speedResponse = await axios.get(`${apiBase}/api/metrics/speedtest`, {
        params: { vanId, range: '1h' },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch interface metrics (last 5 minutes)
      const interfaceResponse = await axios.get(`${apiBase}/api/metrics/interfaces`, {
        params: { vanId, range: '5m' },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch current stats
      const currentResponse = await axios.get(`${apiBase}/api/metrics/current`, {
        params: { vanId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSpeedData(speedResponse.data || []);
      setInterfaceData(interfaceResponse.data || {});
      setCurrentStats(currentResponse.data || null);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [vanId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading network metrics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Download Speed</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {currentStats?.download?.toFixed(1) || '-'} <span className="text-lg">Mbps</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {currentStats?.download >= 50 ? '✓ Excellent' : currentStats?.download >= 10 ? '⚠ Fair' : '✗ Poor'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-medium">Upload Speed</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {currentStats?.upload?.toFixed(1) || '-'} <span className="text-lg">Mbps</span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            {currentStats?.upload >= 20 ? '✓ Excellent' : currentStats?.upload >= 5 ? '⚠ Fair' : '✗ Poor'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Ping Latency</div>
          <div className="text-3xl font-bold text-purple-900 mt-2">
            {currentStats?.ping?.toFixed(0) || '-'} <span className="text-lg">ms</span>
          </div>
          <div className="text-xs text-purple-600 mt-1">
            {currentStats?.ping <= 50 ? '✓ Excellent' : currentStats?.ping <= 100 ? '⚠ Fair' : '✗ Poor'}
          </div>
        </div>
      </div>

      {/* Internet Speed Chart (Speedtest) */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Internet Speed History (Speedtest)</h3>
        {speedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                tick={{ fontSize: 12 }}
              />
              <YAxis label={{ value: 'Speed (Mbps)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                labelFormatter={formatTime}
                formatter={(value) => `${value.toFixed(2)} Mbps`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="download" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Download"
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="upload" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Upload"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No speedtest data available yet. Speedtest runs every 5 minutes.
          </div>
        )}
      </div>

      {/* Per-Interface Bandwidth */}
      {Object.keys(interfaceData).length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Real-time Interface Bandwidth</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(interfaceData).map(([interfaceName, data]) => (
              <div key={interfaceName} className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">{interfaceName}</h4>
                {data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatTime}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        labelFormatter={formatTime}
                        formatter={(value) => `${value.toFixed(2)} Mbps`}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="download_mbps" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Download"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="upload_mbps" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Upload"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-4">No data</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh indicator */}
      <div className="text-xs text-gray-500 text-center">
        Auto-refreshing every 10 seconds • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}





