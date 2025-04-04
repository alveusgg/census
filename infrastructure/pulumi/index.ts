import { Database } from '@pulumi/azure-native/dbforpostgresql';
import {
  BlobContainer,
  Kind,
  listStorageAccountKeysOutput,
  SkuName,
  StorageAccount
} from '@pulumi/azure-native/storage';
import { ListStorageAccountKeysResult } from '@pulumi/azure-native/storage/v20220901';
import { getZoneOutput, WorkersSecret } from '@pulumi/cloudflare';
import { Config, getProject, getStack, interpolate } from '@pulumi/pulumi';
import { RandomPassword } from '@pulumi/random';
import { API } from './resources/API';
import { BackstageConfiguration } from './resources/BackstageConfiguration';
import { ContainerAppsCluster } from './resources/ContainerAppsCluster';
import { KV } from './resources/KV';
import { PostgreSQLFlexibleServer } from './resources/PostgreSQLFlexibleServer';
import { Project } from './resources/Project';
import { Website } from './resources/Website';
import { WorkerConfig } from './resources/WorkerConfig';

const stack = getStack();
const id = `${getProject()}-${stack}`;
const simpleId = `apc${stack}`;

// MARK: Config
const config = new Config();

export = async () => {
  const zone = getZoneOutput({
    accountId: config.require('cf-account-id'),
    zoneId: config.require('cf-zone-id')
  });

  const project = new Project(id, {
    cloudflare: {
      zone,
      originCertificate: config.require('cloudflare-origin-cert'),
      originCertificatePassword: config.get('cloudflare-origin-cert-password') ?? ''
    }
  });

  // MARK: Website
  const website = new Website(`${simpleId}-web`, {
    project,
    type: 'spa',
    subdomain: 'census'
  });

  const cluster = new ContainerAppsCluster(`${id}-clstr`, {
    project
  });

  // Create config from incoming
  // Return config as json in the outputs

  // echo output into "./wrangler.generated.jsonc"
  // e.g. echo {{ pulumi.output.wrangler.config }} > ./wrangler.generated.jsonc
  // Run wrangler deploy w/ auth
  // e.g. wrangler deploy --config ./wrangler.generated.jsonc
  // CF_API_TOKEN is set in the environment
  // CF_ACCOUNT_ID is set in the environment

  // MARK: Storage
  const storage = new StorageAccount(simpleId, {
    enableHttpsTrafficOnly: true,
    kind: Kind.StorageV2,
    resourceGroupName: project.group.name,
    sku: {
      name: SkuName.Standard_LRS
    },
    allowBlobPublicAccess: true
  });

  const key = listStorageAccountKeysOutput({
    resourceGroupName: project.group.name,
    accountName: storage.name
  }).apply((r: ListStorageAccountKeysResult) => {
    if (!r.keys[0].value) throw new Error('Primary key not found');
    return r.keys[0].value;
  });

  const container = new BlobContainer(`${simpleId}-assets-blob`, {
    resourceGroupName: project.group.name,
    accountName: storage.name,
    publicAccess: 'Blob',
    containerName: 'assets'
  });

  // MARK: Database
  const server = new PostgreSQLFlexibleServer(`${id}-db`, {
    resourceGroupName: project.group.name,
    configuration: {
      wal_level: 'logical'
    }
  });

  const database = new Database(`${id}-db-api`, {
    resourceGroupName: project.group.name,
    serverName: server.name
  });

  // MARK: Cache
  const kv = new KV(`${id}-kv`, {
    accountId: config.require('cf-account-id')
  });

  const workerAPIToken = new RandomPassword(`${id}-worker-api-token`, {
    length: 32,
    special: true
  });

  // MARK: API
  const api = new API(`${id}-api`, {
    name: 'api',
    project,
    cluster,
    subdomain: 'api-census',
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

      CF_ACCOUNT_ID: config.require('cf-account-id'),
      CF_KV_NAMESPACE: kv.namespace.id,
      CF_KV_TOKEN: kv.token.value,

      WORKER_API_TOKEN: workerAPIToken.result,

      JWT_SECRET: config.require('jwt-secret'),
      TWITCH_CLIENT_ID: config.require('twitch-client-id'),
      TWITCH_CLIENT_SECRET: config.require('twitch-client-secret'),

      MUX_TOKEN_ID: config.require('mux-token-id'),
      MUX_TOKEN_SECRET: config.require('mux-token-secret'),

      DEV_FLAG_USE_TWITCH_CLIP_DIRECTLY: 'true',

      STORAGE_CONNECTION_STRING: interpolate`DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${key};EndpointSuffix=core.windows.net`,
      CONTAINER_NAME: container.name,

      APPLICATIONINSIGHTS_CONNECTION_STRING: project.insights.connectionString
    },
    image: config.require('image'),
    scale: {
      min: 0,
      max: 1,
      noOfRequestsPerInstance: 100
    }
  });

  // MARK: Image Optimisation
  const imageOptimisation = new API(`${id}-ipx`, {
    name: 'ipx',
    project,
    cluster,
    subdomain: 'image-optimisation-census',
    env: {
      IPX_HTTP_DOMAINS: interpolate`${storage.name}.blob.core.windows.net`,
      IPX_HTTP_MAX_AGE: '86400'
    },
    image: config.require('ipx'),
    size: 'micro',
    scale: {
      min: 0,
      max: 1,
      noOfRequestsPerInstance: 50
    },
    port: 3000
  });

  const worker = new WorkerConfig(`${id}-worker-config`, {
    account_id: config.require('cf-account-id'),
    name: 'sync',
    env: stack,
    main: 'worker.ts',
    vars: {
      API_BASE_URL: api.defaultUrl
    },
    durable_objects: {
      bindings: [
        {
          class_name: 'TldrawDurableObject',
          name: 'TLDRAW_DURABLE_OBJECT'
        }
      ]
    },
    migrations: [
      {
        tag: 'v1',
        new_classes: ['TldrawDurableObject']
      }
    ],
    routes: [
      {
        custom_domain: true,
        pattern: interpolate`${id}-sync.strangecyan.com`
      }
    ]
  });

  // This might fail on the very first run, but it will work on the second run
  // Secrets are only created if the associated worker is created
  new WorkersSecret(`${id}-worker-secret`, {
    name: 'WORKER_API_TOKEN',
    accountId: config.require('cf-account-id'),
    scriptName: worker.name,
    secretText: workerAPIToken.result
  });

  // MARK: Backstage
  const backstage = new BackstageConfiguration(`${id}-backstage`, {
    ...website,
    resourceGroupName: project.group.name,
    env: {
      variables: {
        apiBaseUrl: api.defaultUrl,
        ipxBaseUrl: imageOptimisation.defaultUrl,
        syncWorkerUrl: worker.hostname.apply(h => `https://${h}`),
        appInsightsConnectionString: project.insights.connectionString
      },
      flags: {}
    }
  });
  // MARK: Outputs
  return {
    ...website,
    ...worker,
    backstage
  };
};
