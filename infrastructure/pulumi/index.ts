import { Component, IngestionMode } from '@pulumi/azure-native/insights';
import { getSharedKeysOutput, GetSharedKeysResult, Workspace } from '@pulumi/azure-native/operationalinsights';
import { ResourceGroup } from '@pulumi/azure-native/resources';
import { Config, getProject, getStack, interpolate } from '@pulumi/pulumi';

import { ManagedEnvironment, ManagedEnvironmentsStorage } from '@pulumi/azure-native/app';
import { API } from './resources/API';

import { Endpoint, QueryStringCachingBehavior } from '@pulumi/azure-native/cdn';
import { Configuration, Database } from '@pulumi/azure-native/dbforpostgresql';
import {
  BlobContainer,
  FileShare,
  Kind,
  listStorageAccountKeysOutput,
  SkuName,
  StorageAccount
} from '@pulumi/azure-native/storage';
import { ListStorageAccountKeysResult } from '@pulumi/azure-native/storage/v20220901';
import { BackstageConfiguration } from './resources/BackstageConfiguration';
import { PostgreSQLFlexibleServer } from './resources/PostgreSQLFlexibleServer';
import { Website } from './resources/Website';

const project = getProject();
const stack = getStack();
const id = `${project}-${stack}`;
const simpleId = `apc${stack}`;

// MARK: Config
const config = new Config();

export = async () => {
  // MARK: Resource Group
  const group = new ResourceGroup(`${id}-group`);

  // MARK: Logs
  const workspace = new Workspace(`${id}-logs`, {
    resourceGroupName: group.name,
    sku: { name: 'PerGB2018' },
    retentionInDays: 30
  });

  const workspaceSharedKey = getSharedKeysOutput({
    resourceGroupName: group.name,
    workspaceName: workspace.name
  }).apply((r: GetSharedKeysResult) => {
    if (!r.primarySharedKey) throw new Error('Primary shared key not found');
    return r.primarySharedKey;
  });

  const appInsights = new Component(`${id}-app-insights`, {
    resourceGroupName: group.name,
    applicationType: 'web',
    kind: 'web',
    ingestionMode: IngestionMode.LogAnalytics,
    workspaceResourceId: workspace.id
  });

  // MARK: Website
  const website = new Website(`${simpleId}-web`, {
    resourceGroupName: group.name,
    type: 'spa'
  });

  const environment = new ManagedEnvironment(`${id}-managed`, {
    resourceGroupName: group.name,
    appLogsConfiguration: {
      destination: 'log-analytics',
      logAnalyticsConfiguration: {
        customerId: workspace.customerId,
        sharedKey: workspaceSharedKey
      }
    }
  });

  const storage = new StorageAccount(simpleId, {
    enableHttpsTrafficOnly: true,
    kind: Kind.StorageV2,
    resourceGroupName: group.name,
    sku: {
      name: SkuName.Standard_LRS
    },
    allowBlobPublicAccess: true
  });

  const key = listStorageAccountKeysOutput({
    resourceGroupName: group.name,
    accountName: storage.name
  }).apply((r: ListStorageAccountKeysResult) => {
    if (!r.keys[0].value) throw new Error('Primary key not found');
    return r.keys[0].value;
  });

  const share = new FileShare(`${simpleId}share`, {
    resourceGroupName: group.name,
    accountName: storage.name
  });

  const environmentCacheStorage = new ManagedEnvironmentsStorage(`${simpleId}-cache`, {
    resourceGroupName: group.name,
    environmentName: environment.name,
    properties: {
      azureFile: {
        accountName: storage.name,
        shareName: share.name,
        accessMode: 'ReadWrite',
        accountKey: key
      }
    }
  });

  const container = new BlobContainer(`${simpleId}-image-blob`, {
    resourceGroupName: group.name,
    accountName: storage.name,
    publicAccess: 'Blob',
    containerName: 'images'
  });

  // MARK: Database
  const server = new PostgreSQLFlexibleServer(`${id}-db`, {
    resourceGroupName: group.name
  });

  new Configuration(`${id}-db-wal-config`, {
    resourceGroupName: group.name,
    serverName: server.name,
    configurationName: 'wal_level',
    source: 'user-override',
    value: 'logical'
  });

  const database = new Database(`${id}-db-api`, {
    resourceGroupName: group.name,
    serverName: server.name
  });

  // MARK: API
  const api = new API(`${id}-api`, {
    name: 'api',
    resourceGroupName: group.name,
    environmentName: environment.name,
    port: 3000,
    size: 'regular',
    env: {
      HOST: '0.0.0.0',
      PORT: '3000',

      POSTGRES_HOST: server.host,
      POSTGRES_USER: server.administratorUsername,
      POSTGRES_PASSWORD: server.administratorPassword,
      POSTGRES_SSL: 'true',
      POSTGRES_DB: database.name,

      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',

      JWT_SECRET: config.require('jwt-secret'),
      TWITCH_CLIENT_ID: config.require('twitch-client-id'),
      TWITCH_CLIENT_SECRET: config.require('twitch-client-secret'),

      MUX_TOKEN_ID: config.require('mux-token-id'),
      MUX_TOKEN_SECRET: config.require('mux-token-secret'),

      DEV_FLAG_USE_TWITCH_CLIP_DIRECTLY: 'true',

      STORAGE_CONNECTION_STRING: interpolate`DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${key};EndpointSuffix=core.windows.net`,
      CONTAINER_NAME: container.name,

      APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.connectionString
    },
    volumes: {
      dragonfly: {
        path: '/data',
        storage: environmentCacheStorage
      }
    },
    image: config.require('image'),
    scale: {
      min: 0,
      max: 1,
      noOfRequestsPerInstance: 100
    },
    sidecars: [
      {
        name: 'dragonfly-cache',
        image: 'docker.dragonflydb.io/dragonflydb/dragonfly:latest',
        volumes: {
          dragonfly: {
            path: '/data',
            storage: environmentCacheStorage
          }
        },
        env: {}
      }
    ]
  });

  const imageOptimisation = new API(`${id}-ipx`, {
    name: 'ipx',
    resourceGroupName: group.name,
    environmentName: environment.name,
    env: {},
    image: 'node:22',
    command: [
      interpolate`IPX_HTTP_DOMAINS=${storage.name}.blob.core.windows.net IPX_HTTP_MAX_AGE=86400 npx --yes ipx serve --port 3000 --host 0.0.0.0`
    ],
    size: 'micro',
    scale: {
      min: 0,
      max: 1,
      noOfRequestsPerInstance: 50
    },
    port: 3000
  });

  const imageOptimisationEndpoint = new Endpoint(`${id}-ipx-cdn`, {
    endpointName: `${id}-ipx-cdn`,
    location: 'global',
    isHttpAllowed: false,
    isHttpsAllowed: true,
    originHostHeader: imageOptimisation.defaultHost,
    origins: [
      {
        hostName: imageOptimisation.defaultHost,
        httpsPort: 443,
        name: 'origin-image-optimisation'
      }
    ],
    profileName: website.profileName,
    queryStringCachingBehavior: QueryStringCachingBehavior.IgnoreQueryString,
    resourceGroupName: group.name
  });

  // MARK: Backstage
  const backstage = new BackstageConfiguration(`${id}-backstage`, {
    ...website,
    env: {
      variables: {
        apiBaseUrl: api.defaultUrl,
        ipxBaseUrl: imageOptimisationEndpoint.hostName.apply(host => `https://${host}`),
        appInsightsConnectionString: appInsights.connectionString
      },
      flags: {}
    }
  });
  // MARK: Outputs
  return {
    ...website,
    backstage
  };
};
