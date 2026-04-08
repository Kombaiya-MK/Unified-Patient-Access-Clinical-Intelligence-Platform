import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      imagetools({
        defaultDirectives: (url) => {
          if (url.searchParams.has('responsive')) {
            return new URLSearchParams({
              w: '400;800;1200',
              format: 'webp',
              as: 'srcset',
            });
          }
          return new URLSearchParams();
        },
      }),
    ],
    base: env.VITE_BASE_PATH || '/',
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
    },
  };
});
