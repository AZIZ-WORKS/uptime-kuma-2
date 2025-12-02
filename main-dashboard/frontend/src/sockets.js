import { io } from 'socket.io-client';

// Auto-detect backend URL based on how frontend is accessed
const getBackendUrl = () => {
  const stored = localStorage.getItem('BACKEND_URL');
  if (stored) return stored;
  
  const env = import.meta.env.VITE_WS_URL;
  if (env) return env;
  
  try {
    const currentUrl = new URL(window.location.origin);
    
    // Local development: same host, different port
    if (currentUrl.port === '5173') {
      currentUrl.port = '4000';
      return currentUrl.origin;
    }
    
    // For ngrok or other cases, use the setup screen
    return 'http://localhost:4000';
  } catch (_) {
    return 'http://localhost:4000';
  }
};

const wsUrl = getBackendUrl();

export const socket = io(wsUrl, { transports: ['websocket', 'polling'], autoConnect: true });



