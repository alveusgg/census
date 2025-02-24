import { DeepPartial } from 'ts-essentials';
import { Config } from './config';

export const url = 'https://cdn-endpnt-apcprodwebaee53609.azureedge.net/backstage.json';

export const config: DeepPartial<Config> = {
  variables: {
    apiBaseUrl: 'http://localhost:35523',
    ipxBaseUrl: 'http://localhost:2209',
    imageEncryptionKey: 'a1b2c3d4e5f60718293a4b5c6d7e8f90'
  },
  flags: {
    crop: false
  }
};
