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

export default function LocationSection({ vanId }) {
  const [location, setLocation] = useState({ latitude: null, longitude: null, city: null, country: null, public_ip: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLocation() {
      const token = localStorage.getItem('token');
      try {
        // Query Prometheus via backend proxy (if available) or directly
        // Try backend API first
        try {
          // You may need to add a location endpoint to backend
          // For now, try querying Prometheus directly if accessible
          const prometheusUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:9090' 
            : `${getApiBase().replace(':4000', ':9090')}`;
          
          const response = await fetch(`${prometheusUrl}/api/v1/query?query=van_location_info{van_id="${vanId}"}`);
          const data = await response.json();
          
          if (data.status === 'success' && data.data?.result?.length > 0) {
            const metric = data.data.result[0].metric;
            const latResponse = await fetch(`${prometheusUrl}/api/v1/query?query=van_location_latitude{van_id="${vanId}"}`);
            const lonResponse = await fetch(`${prometheusUrl}/api/v1/query?query=van_location_longitude{van_id="${vanId}"}`);
            
            const latData = await latResponse.json();
            const lonData = await lonResponse.json();
            
            const lat = latData.data?.result?.[0]?.value?.[1];
            const lon = lonData.data?.result?.[0]?.value?.[1];
            
            setLocation({
              latitude: lat ? parseFloat(lat) : null,
              longitude: lon ? parseFloat(lon) : null,
              city: metric.city || null,
              country: metric.country || null,
              public_ip: metric.public_ip || null,
            });
          }
        } catch (promErr) {
          console.warn('Failed to query Prometheus directly:', promErr);
        }
        
        setLoading(false);
      } catch (err) {
        console.warn('Failed to load location:', err);
        setLoading(false);
      }
    }

    loadLocation();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadLocation, 60000);
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
        <div className="text-gray-500 text-center py-8">Location data not available</div>
      )}
    </div>
  );
}
