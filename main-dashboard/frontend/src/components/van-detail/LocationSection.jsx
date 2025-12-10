import React, { useEffect, useState } from 'react';
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

// LocationSection: Displays van location data from the agent (van)
// Data flow: Agent (van) → Prometheus → Backend API → Frontend
export default function LocationSection({ vanId }) {
  const [location, setLocation] = useState({ latitude: null, longitude: null, city: null, country: null, public_ip: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLocation() {
      const token = localStorage.getItem('token');
      try {
        // Query location via backend API (which queries Prometheus, which scrapes from agent/van)
        const response = await axios.get(`${getApiBase()}/api/metrics/location`, {
          params: { vanId },
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.data) {
          setLocation({
            latitude: response.data.latitude !== null && response.data.latitude !== undefined 
              ? parseFloat(response.data.latitude) 
              : null,
            longitude: response.data.longitude !== null && response.data.longitude !== undefined 
              ? parseFloat(response.data.longitude) 
              : null,
            city: response.data.city || null,
            country: response.data.country || null,
            public_ip: response.data.public_ip || null,
            region: response.data.region || null,
            timezone: response.data.timezone || null,
            isp: response.data.isp || null,
            error: response.data.error || null,
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.warn('Failed to load location from agent:', err);
        setLoading(false);
      }
    }

    // Load immediately
    loadLocation();
    
    // Refresh every 60 seconds to get latest location from agent
    const interval = setInterval(() => {
      loadLocation();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [vanId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Location</h2>
        <div className="text-gray-500">Loading location...</div>
      </div>
    );
  }

  const hasLocation = location.latitude !== null && location.longitude !== null;
  const mapUrl = hasLocation 
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : null;

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Location</h2>
      {hasLocation ? (
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Coordinates</div>
            <div className="font-mono text-sm">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </div>
          </div>
          {(location.city || location.country) && (
            <div className="text-sm">
              <div><span className="font-semibold">City:</span> {location.city || 'Unknown'}</div>
              <div className="mt-1"><span className="font-semibold">Country:</span> {location.country || 'Unknown'}</div>
            </div>
          )}
          {location.public_ip && (
            <div className="text-xs text-gray-500">
              IP: {location.public_ip}
            </div>
          )}
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="block mt-3 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition"
            >
              View on Google Maps
            </a>
          )}
        </div>
      ) : (
        <div className="text-gray-500 text-center py-8">
          {location.error ? (
            <div>
              <p className="text-sm">{location.error}</p>
              <p className="text-xs mt-2">Waiting for agent to send location data...</p>
            </div>
          ) : (
            <div>
              <p>Location data not available</p>
              <p className="text-xs mt-2">Make sure the agent is running and sending location metrics</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
