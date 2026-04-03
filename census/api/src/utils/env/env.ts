import { z } from 'zod';
import { type User as CoreUser } from '../../db/schema/users.js';
import { type TokenPayload } from '../../services/auth/router.js';
import { panic } from '../assert.js';
import { config, services } from './config.js';

type Env = {
  variables: z.infer<typeof config>;
  host: string;
} & Awaited<ReturnType<typeof services>>;

export const createEnvironment = async (): Promise<Env> => {
  const variables = config.parse(process.env);
  const host = getHost(variables);

  return {
    variables,
    host,
    ...(await services(variables))
  };
};

export const getHost = (variables: z.infer<typeof config>): string => {
  if (variables.NODE_ENV === 'development') {
    return `http://${variables.HOST}:${variables.PORT}`;
  }
  if (variables.API_URL) {
    return variables.API_URL;
  }
  if (variables.CONTAINER_APP_NAME && variables.CONTAINER_APP_ENV_DNS_SUFFIX) {
    return `https://${variables.CONTAINER_APP_NAME}.${variables.CONTAINER_APP_ENV_DNS_SUFFIX}`;
  }

  return panic('No host found');
};

import { createStore } from '@alveusgg/node';
const EnvironmentStore = createStore<Env>('environment');
export const [withEnvironment, useEnvironment] = EnvironmentStore;

type UserActions = {
  points: () => void;
  achievements: () => void;
};

type User = TokenPayload & CoreUser & UserActions;

const UserStore = createStore<User>('user');
export const [withUser, useUser] = UserStore;
