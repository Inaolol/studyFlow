import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/studyFlow/',
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'StudyFlow',
        short_name: 'StudyFlow',
        description: 'A signal-reactive study planner',
        theme_color: '#e34432',
        background_color: '#fefdfc',
        display: 'standalone',
        start_url: '/studyFlow/',
        icons: [
          { src: '/studyFlow/icons/icon-192.png',          sizes: '192x192', type: 'image/png' },
          { src: '/studyFlow/icons/icon-512.png',          sizes: '512x512', type: 'image/png' },
          { src: '/studyFlow/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
});
