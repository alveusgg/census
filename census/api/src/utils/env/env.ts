import { TokenPayload } from '../../services/auth/router.js';
import { config, services } from './config.js';

type Env = Awaited<ReturnType<typeof createEnvironment>>;
export const createEnvironment = async () => {
  const variables = config.parse(process.env);
  return {
    variables,
    ...(await services(variables))
  };
};

import { createStore } from '@alveusgg/node';
const EnvironmentStore = createStore<Env>('environment');
export const [withEnvironment, useEnvironment] = EnvironmentStore;

const UserStore = createStore<TokenPayload>('user');
export const [withUser, useUser] = UserStore;
