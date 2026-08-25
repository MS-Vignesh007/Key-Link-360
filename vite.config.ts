import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // data-store.json is rewritten by the local Express API. Excluding it
      // prevents API writes from triggering a Vite page-reload loop.
      watch: process.env.DISABLE_HMR === 'true'
        ? null
        : {
            ignored: ['**/data-store.json', '**/dist/**'],
          },
    },
  };
});
