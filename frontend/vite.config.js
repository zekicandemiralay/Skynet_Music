import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      // Stamp sw.js with the build time so the service worker cache is always
      // fresh after a deployment — prevents stale offline app shell on phones.
      name: 'sw-version',
      closeBundle() {
        const swPath = join(__dirname, 'dist', 'sw.js');
        try {
          const sw = readFileSync(swPath, 'utf8');
          writeFileSync(swPath, sw.replace('__SW_VERSION__', `skynet-${Date.now()}`));
        } catch {}
      },
    },
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
