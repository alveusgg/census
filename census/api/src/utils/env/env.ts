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

interface User {
  id: string;
}

const UserStore = createStore<User>('user');
export const [withUser, useUser] = UserStore;
