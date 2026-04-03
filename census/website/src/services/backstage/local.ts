import { DeepPartial } from 'ts-essentials';
import { Config } from './config';

export const config: DeepPartial<Config> = {
  variables: {
    apiBaseUrl: 'http://localhost:35523',
    ipxBaseUrl: 'http://localhost:2209',
    syncWorkerUrl: 'http://localhost:5172'
  },
  flags: {
    crop: false
  }
};
