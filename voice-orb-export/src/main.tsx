import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// StrictMode is intentionally left on: it double-invokes effects in dev, which
// is the cleanest way to prove the renderer/audio cleanup logic is leak-free.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
