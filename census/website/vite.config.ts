import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import BuildInfo from 'vite-plugin-info';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), BuildInfo({ meta: { build: process.env['GITHUB_SHA'] } })],
  esbuild: { keepNames: true },
  build: { sourcemap: true },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
