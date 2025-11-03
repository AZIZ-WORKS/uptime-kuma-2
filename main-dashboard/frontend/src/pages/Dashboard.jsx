import React, { useEffect, useState } from 'react';
import { socket } from '../sockets.js';
import VanCard from '../components/VanCard.jsx';
import Charts from '../components/Charts.jsx';

export default function Dashboard() {
  const [vans, setVans] = useState({});

  useEffect(() => {
    const handleUpdate = (payload) => {
      setVans((prev) => ({ ...prev, [payload.vanId]: payload }));
    };
    socket.on('dashboard:update', handleUpdate);
    return () => {
      socket.off('dashboard:update', handleUpdate);
    };
  }, []);

  const items = Object.values(vans);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    if (!selected && items.length) setSelected(items[0].vanId);
  }, [items, selected]);
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Live Dashboard</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {items.map((v) => (
          <div key={v.vanId} onClick={() => setSelected(v.vanId)} className="cursor-pointer">
            <VanCard van={v} />
          </div>
        ))}
      </div>
      {selected && (
        <div className="mt-6">
          <Charts vanId={selected} />
        </div>
      )}
    </div>
  );
}


