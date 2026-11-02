import react from '@vitejs/plugin-react';

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import BuildInfo from 'vite-plugin-info';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  // Extra hostnames the dev server may be reached on (comma-separated), e.g. a tailnet name. Local and opt-in.
  const allowedHosts = env.VITE_ALLOWED_HOSTS?.split(',')
    .map(host => host.trim())
    .filter(Boolean);

  return {
    plugins: [react(), BuildInfo({ meta: { build: process.env['GITHUB_SHA'] } })],
    esbuild: { keepNames: true },
    build: { sourcemap: true },
    server: allowedHosts?.length ? { allowedHosts } : undefined,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  };
});
