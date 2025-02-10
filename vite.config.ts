import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5175,
    hmr: {
      overlay: true
    },
    logger: {
      level: 'info'
    }
  },
  define: {
    'process.env': {
      VITE_UPSTASH_REDIS_REST_URL: process.env.VITE_UPSTASH_REDIS_REST_URL,
      VITE_UPSTASH_REDIS_REST_TOKEN: process.env.VITE_UPSTASH_REDIS_REST_TOKEN
    }
  }
});
