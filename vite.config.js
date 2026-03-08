import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/comick': {
        target: 'https://api.comick.dev', // Added 'api.' prefix
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/comick/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://comick.dev');
            proxyReq.setHeader('Referer', 'https://comick.dev/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
          });
        },
      },
    },
  },
})