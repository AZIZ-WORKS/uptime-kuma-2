import { io } from 'socket.io-client';

const fallbackWs = (() => {
  try {
    const u = new URL(window.location.origin);
    if (u.port === '5173') u.port = '4000';
    return u.origin;
  } catch (_) {
    return 'http://localhost:4000';
  }
})();

const wsUrl = import.meta.env.VITE_WS_URL || fallbackWs;

export const socket = io(wsUrl, { transports: ['websocket'], autoConnect: true });



