import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Dev-only: ?rafshim drives requestAnimationFrame from setTimeout so the
// scene renders in headless/hidden tabs where RAF is suspended (used by
// the local preview tooling to screenshot the orb). Harmless otherwise.
if (new URLSearchParams(window.location.search).has('rafshim')) {
  window.requestAnimationFrame = (cb: FrameRequestCallback) =>
    window.setTimeout(() => cb(performance.now()), 16) as unknown as number;
  window.cancelAnimationFrame = (id: number) => window.clearTimeout(id);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
