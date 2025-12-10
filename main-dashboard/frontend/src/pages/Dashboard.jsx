import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Card, CardContent } from 'recharts';
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

export default function Dashboard() {
  const [vans, setVans] = useState([]);
  const [stats, setStats] = useState({
    totalVans: 0,
    onlineVans: 0,
    offlineVans: 0,
    totalDevices: 0,
    onlineDevices: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadVans = async () => {
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.get(`${getApiBase()}/api/vans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const vansList = Array.isArray(data) ? data : [];
      setVans(vansList);
      
      // Calculate stats
      const online = vansList.filter(v => v.status === 'up').length;
      const offline = vansList.length - online;
      
      setStats({
        totalVans: vansList.length,
        onlineVans: online,
        offlineVans: offline,
        totalDevices: 0, // Will be updated when devices are loaded
        onlineDevices: 0,
      });
      
      setLoading(false);
    } catch (err) {
      console.warn('Failed to load vans:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVans();
    
    // Listen for van updates
    const handleVanUpdate = (payload) => {
      setVans(prev => {
        if (!Array.isArray(prev)) return prev;
        const updated = prev.map(v => 
          v.id === payload.vanId 
            ? { ...v, status: payload.status, last_latency: payload.latency, last_seen: Date.now() }
            : v
        );
        
        // Update stats
        const online = updated.filter(v => v.status === 'up').length;
        setStats(prevStats => ({
          ...prevStats,
          onlineVans: online,
          offlineVans: updated.length - online,
        }));
        
        return updated;
      });
    };
    
    socket.on('dashboard:update', handleVanUpdate);
    return () => {
      socket.off('dashboard:update', handleVanUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Monitoring Dashboard</h1>
        <Link
          to="/vans"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View All Vans
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Total Vans</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalVans}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Online Vans</div>
          <div className="text-3xl font-bold text-green-600">{stats.onlineVans}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="text-sm text-gray-600 mb-1">Offline Vans</div>
          <div className="text-3xl font-bold text-red-600">{stats.offlineVans}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">Total Devices</div>
          <div className="text-3xl font-bold text-purple-600">{stats.totalDevices}</div>
        </div>
      </div>

      {/* Vans List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Vans Overview</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {vans.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">No vans found.</p>
              <p className="text-sm">Make sure agents are connected and configured.</p>
            </div>
          ) : (
            vans.map((van) => (
              <div key={van.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/vans/${van.id}`}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {van.name || van.id}
                      </Link>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          van.status === 'up'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {van.status === 'up' ? '● Online' : '● Offline'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>ID: {van.id}</span>
                      {van.last_latency && <span>Latency: {van.last_latency}ms</span>}
                      {van.mac && <span>MAC: {van.mac}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/vans/${van.id}`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Dashboard
                    </Link>
                    {van.kuma_status_url && (
                      <a
                        href={van.kuma_status_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Kuma Status
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
