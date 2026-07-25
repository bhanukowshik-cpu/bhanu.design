import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds src/embed.tsx into a single self-contained ESM file (React + ogl
// inlined) that mounts the VoiceOrb visual into a host <div>. Separate from the
// app build so the playground is untouched.
export default defineConfig({
  plugins: [react()],
  // React reads process.env.NODE_ENV; in a browser lib bundle that global
  // doesn't exist, so replace it at build time (and use React's prod path).
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
  },
  build: {
    lib: {
      entry: 'src/embed.tsx',
      formats: ['es'],
      fileName: () => 'bhanu-orb.js',
    },
    outDir: 'dist-embed',
    emptyOutDir: true,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
