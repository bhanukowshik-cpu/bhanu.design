import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // relative base so the built app works served from any sub-path
  // (we view it at http://localhost:8080/voice-orb-lab/dist/)
  base: './',
});
