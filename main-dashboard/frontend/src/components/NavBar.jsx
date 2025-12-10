import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NavBar({ backendUrl, onChangeBackend }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-gray-900">
              🚐 Van Monitoring
            </Link>
            {token && (
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/vans"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/vans') || location.pathname.startsWith('/vans/')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Vans
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {backendUrl && (
              <button
                onClick={onChangeBackend}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                title={`Backend: ${backendUrl}`}
              >
                ⚙️ Backend
              </button>
            )}
            {token ? (
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="px-4 py-2 text-sm font-medium text-red-700 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
