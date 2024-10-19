import merge from 'lodash.merge';
import { FC, PropsWithChildren, createContext, useContext, useRef } from 'react';
import { StoreApi, createStore, useStore } from 'zustand';

export interface BackstageConfig {
  variables?: {
    [key: string]: string;
  };
  flags?: {
    [key: string]: boolean;
  };
}

const getConfigurations = (providers: ProviderConfiguration[]) => {
  const configurations = providers.map(provider => {
    const configuration = provider.config;
    if (!configuration) {
      throw new Error('Configuration is required either in the provider or in the get function');
    }

    return {
      priority: provider.priority,
      config: configuration
    };
  });
  return configurations.sort((a, b) => a.priority - b.priority).map(configuration => configuration.config);
};

const getConfigurationFromProviders = (
  providers: ProviderConfiguration[],
  initialConfiguration: BackstageConfig = {}
) => {
  const sortedConfigurations = getConfigurations(providers);
  return merge({ ...initialConfiguration }, ...sortedConfigurations) as BackstageConfig;
};

interface BackstageInfo {
  configuration: BackstageConfig;
}

type BackstageStore = BackstageInfo;
export const BackstageContext = createContext<StoreApi<BackstageStore> | null>(null);

interface BackstageProviderProps {
  config?: BackstageConfig;
  providers: ProviderConfiguration[];
}

export const Backstage: FC<PropsWithChildren<BackstageProviderProps>> = ({ children, providers, config = {} }) => {
  const store = useRef(
    createStore<BackstageStore>(() => ({
      configuration: getConfigurationFromProviders(providers, structuredClone(config))
    }))
  );

  return <BackstageContext.Provider value={store.current}>{children}</BackstageContext.Provider>;
};

export function useBackstage<U>(selector: (store: BackstageStore) => U): U {
  const context = useContext(BackstageContext);
  if (!context) {
    throw new Error('useBackstage must be used within a Backstage');
  }
  return useStore(context, selector);
}

export function useVariable<K extends string>(key: K) {
  return useBackstage(state => state.configuration.variables?.[key]);
}

export function useFlag<K extends string>(key: K) {
  return useBackstage(state => state.configuration.flags?.[key]);
}
export function useFlags<K extends string>(keys: K[]) {
  return useBackstage(state => keys.map(key => state.configuration.flags?.[key]));
}

export function useConfig() {
  return useBackstage(state => state.configuration);
}

export interface ProviderConfiguration {
  priority: number;
  config: BackstageConfig;
}

export type BackstageProvider<T extends { [key: string]: any } = { [key: string]: any }> = (
  priority: number,
  options: T
) => ProviderConfiguration;
