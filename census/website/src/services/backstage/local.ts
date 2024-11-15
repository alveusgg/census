import { DeepPartial } from 'ts-essentials';
import { Config } from './config';

export const url = 'https://ccprodweb832aa1fe.z5.web.core.windows.net/backstage.json';

export const config: DeepPartial<Config> = {
  variables: {
    apiBaseUrl: 'http://localhost:35523',
    ipxBaseUrl: 'http://localhost:2209'
  },
  flags: {
    crop: false
  }
};
