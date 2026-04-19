import { Database } from '@pulumi/azure-native/dbforpostgresql';
import { getZoneOutput } from '@pulumi/cloudflare';
import { Config, getProject, getStack } from '@pulumi/pulumi';
import { API } from './resources/API';
import { ContainerAppsCluster } from './resources/ContainerAppsCluster';
import { PostgreSQLFlexibleServer } from './resources/PostgreSQLFlexibleServer';
import { Project } from './resources/Project';
import { SPAWorker } from './resources/SPAWorker';

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
    cloudflare: { zone }
  });

  const cluster = new ContainerAppsCluster(`${id}-clsr`, {
    project
  });

  // MARK: Database
  const server = new PostgreSQLFlexibleServer(`${id}-db`, {
    resourceGroupName: project.group.name,
    configuration: {
      wal_level: 'logical'
    }
  });

  const database = new Database(`${id}-db`, {
    resourceGroupName: project.group.name,
    serverName: server.name
  });

  const s3PublicUrl = config.require('s3-public-url');

  // MARK: API
  const api = new API(`${id}-api`, {
    name: 'api',
    project,
    cluster,
    subdomain: 'census-api',
    port: 3000,
    size: 'regular',
    env: {
      HOST: '0.0.0.0',
      PORT: '3000',

      TWITCH_CLIENT_ID: config.require('twitch-client-id'),
      TWITCH_CLIENT_SECRET: config.requireSecret('twitch-client-secret'),

      POSTGRES_HOST: server.host,
      POSTGRES_USER: server.administratorUsername,
      POSTGRES_PASSWORD: server.administratorPassword,
      POSTGRES_SSL: 'true',
      POSTGRES_DB: database.name,

      MUX_TOKEN_ID: config.require('mux-token-id'),
      MUX_TOKEN_SECRET: config.require('mux-token-secret'),

      S3_BUCKET: config.require('s3-bucket'),
      S3_REGION: 'auto',
      S3_ACCESS_KEY_ID: config.require('s3-access-key-id'),
      S3_SECRET_ACCESS_KEY: config.requireSecret('s3-secret-access-key'),
      S3_ENDPOINT: config.require('s3-endpoint'),
      S3_PUBLIC_URL: s3PublicUrl,

      ALVEUS_AUTH_ISSUER: 'https://www.alveussanctuary.org',
      ALVEUS_AUTH_CLIENT_ID: 'census',
      ALVEUS_AUTH_CLIENT_SECRET: config.requireSecret('alveus-client-secret'),

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
    subdomain: 'census-ipx',
    env: {
      IPX_HTTP_DOMAINS: s3PublicUrl,
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

  const worker = new SPAWorker(`${id}-worker`, {
    account_id: config.require('cf-account-id'),
    name: 'site',
    env: stack,
    route: `census.alveussanctuary.org`,
    assetsDirectory: 'ui',
    backstage: {
      variables: {
        apiBaseUrl: api.defaultUrl,
        ipxBaseUrl: imageOptimisation.defaultUrl
      },
      flags: {}
    }
  });
  // MARK: Outputs
  return {
    ...worker,
    backstage: worker.hostname.apply(h => `https://${h}/backstage`)
  };
};
