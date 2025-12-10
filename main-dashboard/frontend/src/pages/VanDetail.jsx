import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { socket } from '../sockets.js';
import DeviceStatusSection from '../components/van-detail/DeviceStatusSection.jsx';
import CCTVSection from '../components/van-detail/CCTVSection.jsx';
import EnvironmentSection from '../components/van-detail/EnvironmentSection.jsx';
import LocationSection from '../components/van-detail/LocationSection.jsx';
import NetworkHealthSection from '../components/van-detail/NetworkHealthSection.jsx';
import NetworkSpeedSection from '../components/van-detail/NetworkSpeedSection.jsx';
import InterfaceSpeedSection from '../components/van-detail/InterfaceSpeedSection.jsx';
import SRTStatusSection from '../components/van-detail/SRTStatusSection.jsx';

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

export default function VanDetail() {
  const { vanId } = useParams();
  const [van, setVan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadVan() {
      const token = localStorage.getItem('token');
      try {
        const { data } = await axios.get(`${getApiBase()}/api/vans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const vanData = Array.isArray(data) ? data.find(v => v.id === vanId) : null;
        setVan(vanData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load van:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    if (vanId) {
      loadVan();
    } else {
      setError('No van ID provided');
      setLoading(false);
    }

    // Listen for van updates
    const handleVanUpdate = (payload) => {
      if (payload.vanId === vanId) {
        setVan(prev => prev ? { ...prev, status: payload.status, last_latency: payload.latency, last_seen: Date.now() } : null);
      }
    };

    socket.on('dashboard:update', handleVanUpdate);
    return () => {
      socket.off('dashboard:update', handleVanUpdate);
    };
  }, [vanId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading van details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">Error loading van</h2>
        <p className="text-red-600">{error}</p>
        <Link to="/vans" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Back to Vans
        </Link>
      </div>
    );
  }

  if (!van) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-800 mb-2">Van not found</h2>
        <p className="text-yellow-700 mb-4">Van ID: {vanId}</p>
        <Link to="/vans" className="text-blue-600 hover:underline">
          ← Back to Vans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link to="/vans" className="text-blue-600 hover:text-blue-800 hover:underline mb-2 inline-block">
              ← Back to Vans
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{van.name || vanId}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                van.status === 'up'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {van.status === 'up' ? '● Online' : '● Offline'}
            </span>
            {van.kuma_status_url && (
              <a
                href={van.kuma_status_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Open Kuma Status
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span>Van ID: <span className="font-mono">{van.id}</span></span>
          {van.last_latency && <span>Latency: <span className="font-semibold">{van.last_latency}ms</span></span>}
          {van.mac && <span>MAC: <span className="font-mono">{van.mac}</span></span>}
        </div>
      </div>

      {/* Dashboard Sections */}
      <div className="space-y-6">
        {/* Section 1: Device Status */}
        <DeviceStatusSection vanId={vanId} />

        {/* Section 2: Network Speed Monitoring */}
        <NetworkSpeedSection vanId={vanId} />

        {/* Section 3: Interface Bandwidth */}
        <InterfaceSpeedSection vanId={vanId} />

        {/* Two Column Layout for Smaller Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 4: CCTV Cameras */}
          <CCTVSection vanId={vanId} />

          {/* Section 5: Environment (Humidity & Temperature) */}
          <EnvironmentSection vanId={vanId} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 6: Van Location */}
          <LocationSection vanId={vanId} />

          {/* Section 7: Network Health (OPNsense) */}
          <NetworkHealthSection vanId={vanId} />
        </div>

        {/* Section 8: SRT Status */}
        <SRTStatusSection vanId={vanId} />
      </div>
    </div>
  );
}
