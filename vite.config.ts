import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/ntfy-channel-ui/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'ntfy editor channel',
        short_name: 'ntfy channel',
        description: 'Web UI for ntfy.sh dissertation_editor_ysf channel',
        theme_color: '#1e3a8a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'he',
        dir: 'rtl',
        start_url: '/ntfy-channel-ui/',
        scope: '/ntfy-channel-ui/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
