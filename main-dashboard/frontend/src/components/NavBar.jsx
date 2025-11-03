import React from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  const token = localStorage.getItem('token');
  return (
    <div className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="font-semibold">Main Dashboard</div>
        {token && (
          <>
            <Link to="/" className="text-blue-700">Dashboard</Link>
            <Link to="/vans" className="text-blue-700">Vans</Link>
          </>
        )}
        <div className="ml-auto">
          {token ? (
            <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="text-red-700">Logout</button>
          ) : (
            <Link to="/login" className="text-blue-700">Login</Link>
          )}
        </div>
      </div>
    </div>
  );
}



