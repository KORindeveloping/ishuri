import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/ishuri/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) return 'vendor-recharts';
              if (id.includes('framer-motion') || id.includes('motion')) return 'vendor-motion';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('jspdf')) return 'vendor-pdf';
              if (id.includes('@google/generative-ai') || id.includes('@google/genai')) return 'vendor-ai';
              if (id.includes('react-dom')) return 'vendor-react-dom';
              if (id.includes('react-markdown') || id.includes('remark') || id.includes('unified')) return 'vendor-markdown';
              if (id.includes('hast') || id.includes('vfile') || id.includes('unist') || id.includes('micromark') || id.includes('mdast')) return 'vendor-markdown-deps';
              if (id.includes('html2canvas')) return 'vendor-html2canvas';
              return 'vendor-core';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
