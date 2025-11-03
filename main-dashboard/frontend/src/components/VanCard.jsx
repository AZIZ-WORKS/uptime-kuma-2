import React from 'react';

export default function VanCard({ van }) {
  const online = van.status === 'up';
  return (
    <div className="bg-white p-4 rounded border">
      <div className="flex items-center justify-between">
        <div className="font-medium">{van.vanId}</div>
        <div className={`text-sm ${online ? 'text-green-700' : 'text-red-700'}`}>{online ? 'Online' : 'Offline'}</div>
      </div>
      <div className="text-sm text-gray-600 mt-1">Latency: {van.latency}ms</div>
      <div className="text-sm text-gray-600">Uptime: {van.uptime}%</div>
      <div className="text-xs text-gray-500 mt-1">{van.timestamp}</div>
    </div>
  );
}



