import React, { useState } from 'react';

export default function BackendUrlSetup({ onSave }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!url) {
      setError('Please enter the backend URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      setError('Invalid URL format. Example: https://abc123.ngrok-free.app');
      return;
    }

    // Test connection to backend
    try {
      const response = await fetch(`${url}/health`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      if (!response.ok) {
        setError(`Backend responded with status ${response.status}. Please check the URL.`);
        return;
      }
      
      // Save and reload
      localStorage.setItem('BACKEND_URL', url);
      onSave(url);
    } catch (err) {
      setError(`Cannot connect to backend: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard Setup</h1>
        <p className="text-gray-600 mb-6">
          Enter the backend URL to connect to the dashboard API.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Backend URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://abc123.ngrok-free.app"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can find this URL by running: <code className="bg-gray-100 px-1">bash show-urls.sh</code>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Connect
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-sm font-medium text-blue-900 mb-2">💡 Quick Guide:</p>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Run <code className="bg-blue-100 px-1">bash show-urls.sh</code> on the server</li>
            <li>Copy the <strong>BACKEND URL</strong></li>
            <li>Paste it above and click Connect</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

