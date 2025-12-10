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

export default function EnvironmentSection({ vanId }) {
  const [envData, setEnvData] = useState({ temperature: null, humidity: null, device: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEnvironment() {
      const token = localStorage.getItem('token');
      try {
        // Get devices and filter for temperature/humidity sensors
        const { data } = await axios.get(`${getApiBase()}/api/devices/latest?vanId=${encodeURIComponent(vanId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Look for temperature/humidity devices
        const envDevices = Array.isArray(data) 
          ? data.filter(d => {
              const name = (d.name || '').toLowerCase();
              return name.includes('temp') || name.includes('temperature') || 
                     name.includes('humidity') || name.includes('sensor') ||
                     name.includes('dht') || name.includes('bme');
            })
          : [];
        
        // Try to extract values from device names or use mock data structure
        // You may need to adjust this based on your actual device data structure
        if (envDevices.length > 0) {
          const device = envDevices[0];
          setEnvData({
            device: device.name,
            temperature: device.temperature || null, // Adjust based on your data structure
            humidity: device.humidity || null, // Adjust based on your data structure
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.warn('Failed to load environment data:', err);
        setLoading(false);
      }
    }

    loadEnvironment();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadEnvironment, 30000);
    return () => clearInterval(interval);
  }, [vanId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Environment</h2>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Environment</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Temperature</div>
            <div className="text-3xl font-bold text-blue-700">
              {envData.temperature !== null ? `${envData.temperature}°C` : '--'}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-gray-600 mb-1">Humidity</div>
            <div className="text-3xl font-bold text-green-700">
              {envData.humidity !== null ? `${envData.humidity}%` : '--'}
            </div>
          </div>
        </div>
        {envData.device && (
          <div className="text-xs text-gray-500 text-center">
            Source: {envData.device}
          </div>
        )}
        {!envData.device && (
          <div className="text-gray-500 text-center py-4 text-sm">
            No environment sensor found
          </div>
        )}
      </div>
    </div>
  );
}
