import React, { useEffect, useState } from 'react';
import axios from 'axios';

function getApiBase() {
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

export default function Vans() {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState({});

  async function load() {
    const token = localStorage.getItem('token');
    const { data } = await axios.get(`${getApiBase()}/api/vans`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRows(data);
  }

  useEffect(() => { load(); }, []);

  async function wake(id) {
    const token = localStorage.getItem('token');
    await axios.post(`${getApiBase()}/api/vans/${id}/wake`, {}, { headers: { Authorization: `Bearer ${token}` } });
    alert('Wake requested');
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Vans</h1>
      <div className="space-y-4">
        {rows.map((v) => (
          <div key={v.id} className="bg-white rounded border">
            <div className="p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{v.name} ({v.id})</div>
                <div className="text-sm text-gray-600">Status: {v.status || 'unknown'} • Latency: {v.last_latency ?? '-'}ms • MAC: {v.mac || '-'}</div>
                {v.kuma_status_url && (
                  <div className="text-sm mt-1 flex gap-2">
                    <button
                      className="text-blue-700 underline"
                      onClick={() => toggleExpand(v.id)}
                    >
                      {expanded[v.id] ? 'Hide' : 'Show'} Status Page
                    </button>
                    <a className="text-blue-700 underline" href={v.kuma_status_url} target="_blank" rel="noreferrer">Open in New Tab</a>
                  </div>
                )}
              </div>
              <button
                className={`px-3 py-1 rounded ${v.mac ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                onClick={() => v.mac && wake(v.id)}
                disabled={!v.mac}
              >
                Wake
              </button>
            </div>
            {v.kuma_status_url && expanded[v.id] && (
              <div className="border-t p-2">
                <iframe
                  src={v.kuma_status_url}
                  className="w-full"
                  style={{ height: '600px', border: 'none' }}
                  title={`Status page for ${v.name}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


