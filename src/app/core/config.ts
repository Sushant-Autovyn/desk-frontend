// ─── Central runtime configuration ───────────────────────────────────────────
// SINGLE source of truth for the backend URLs. When you move to the new server,
// change them HERE (one place) — every service imports from this file.
//
// You can also override at runtime WITHOUT rebuilding by setting `window.__env`
// before the app boots (e.g. in index.html):
//   <script>window.__env = { VITE_BACKEND_URL: 'https://api.example.com/api',
//                            VITE_SOCKET_URL:  'https://api.example.com' };</script>

const env = (typeof window !== 'undefined' && (window as any).__env) || {};

// REST API base (includes the /api suffix).
export const BACKEND_URL: string =
  env.VITE_BACKEND_URL || 'https://chat-support-backend-xhfd.onrender.com/api';

// Socket.IO origin (no /api suffix).
export const SOCKET_URL: string =
  env.VITE_SOCKET_URL || 'https://chat-support-backend-xhfd.onrender.com';
