import { DeepPartial } from 'ts-essentials';
import { Config } from './config';

// Dev-only configuration. The URLs can be overridden from a git-ignored `.env.local`
// when the dev servers are reached through a different host (e.g. a tailnet name).
export const config: DeepPartial<Config> = {
  variables: {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:35523',
    ipxBaseUrl: import.meta.env.VITE_IPX_BASE_URL ?? 'http://localhost:2209'
  },
  flags: {
    cloudflareImages: false,
    crop: false
  }
};
