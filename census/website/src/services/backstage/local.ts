import { DeepPartial } from 'ts-essentials';
import { Config } from './config';

export const url = 'https://cdn-endpnt-apcprodwebaee53609.azureedge.net/backstage.json';

export const config: DeepPartial<Config> = {
  variables: {
    apiBaseUrl: 'http://localhost:35523',
    ipxBaseUrl: 'http://localhost:2209'
  },
  flags: {
    crop: false
  }
};
