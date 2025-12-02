import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NetworkCharts from '../components/NetworkCharts.jsx';

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
  const [selectedVan, setSelectedVan] = useState(null);

  const loadVans = async () => {
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.get(`${getApiBase()}/api/vans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVans(Array.isArray(data) ? data : []);
      if (!selectedVan && data.length > 0) {
        setSelectedVan(data[0].id);
      }
    } catch (err) {
      console.warn('Failed to load vans:', err);
    }
  };

  useEffect(() => {
    loadVans();
  }, []);
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Network Monitoring Dashboard</h1>
      
      {/* Van Selector */}
      {vans.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium mb-2">Select Van:</label>
          <div className="flex gap-2 flex-wrap">
            {vans.map((van) => (
              <button
                key={van.id}
                onClick={() => setSelectedVan(van.id)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedVan === van.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {van.name}
                <span className={`ml-2 inline-block w-2 h-2 rounded-full ${
                  van.status === 'up' ? 'bg-green-400' : 'bg-red-400'
                }`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Network Charts */}
      {selectedVan ? (
        <NetworkCharts vanId={selectedVan} />
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <p>No vans available. Add a van from the Vans page.</p>
        </div>
      )}
    </div>
  );
}


