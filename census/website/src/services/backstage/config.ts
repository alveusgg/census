import { BackstageConfig } from '@alveusgg/backstage';

export interface Config extends BackstageConfig {
  variables: {
    apiBaseUrl: string;
    cloudflareImageBaseUrl?: string;
    ipxBaseUrl: string;
    sentryDSN: string;
  };
  flags: {
    cloudflareImages: boolean;
    crop: boolean;
  };
}

export type Variables = keyof Config['variables'];
export type Flags = keyof Config['flags'];
