import { BackstageConfig } from '@alveusgg/backstage';

export interface Config extends BackstageConfig {
  variables: {
    apiBaseUrl: string;
    ipxBaseUrl: string;
    sentryDSN: string;
  };
  flags: {
    crop: boolean;
  };
}

export type Variables = keyof Config['variables'];
export type Flags = keyof Config['flags'];
