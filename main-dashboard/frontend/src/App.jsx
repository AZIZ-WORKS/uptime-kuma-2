import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Vans from './pages/Vans.jsx';
import NavBar from './components/NavBar.jsx';
import BackendUrlSetup from './components/BackendUrlSetup.jsx';

function useAuth() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return { token, role };
}

function Protected({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [backendUrl, setBackendUrl] = useState(localStorage.getItem('BACKEND_URL'));
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Check if we're accessing via ngrok and don't have a backend URL set
    const isNgrok = window.location.hostname.includes('ngrok');
    const hasBackendUrl = !!localStorage.getItem('BACKEND_URL');
    
    if (isNgrok && !hasBackendUrl) {
      setShowSetup(true);
    }
  }, []);

  const handleBackendUrlSave = (url) => {
    setBackendUrl(url);
    setShowSetup(false);
    window.location.reload();
  };

  // Show setup screen if needed
  if (showSetup) {
    return <BackendUrlSetup onSave={handleBackendUrlSave} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <NavBar backendUrl={backendUrl} onChangeBackend={() => setShowSetup(true)} />
      <div className="p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/vans" element={<Protected><Vans /></Protected>} />
        </Routes>
      </div>
    </div>
  );
}



