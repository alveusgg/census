import { BindingType, ContainerApp, ManagedEnvironmentsStorage } from '@pulumi/azure-native/app';
import { PrincipalType, RoleAssignment, getClientConfig } from '@pulumi/azure-native/authorization';
import { Record as CloudflareRecord } from '@pulumi/cloudflare';
import { ComponentResource, Input, Output, ResourceOptions, interpolate, output } from '@pulumi/pulumi';
import { ContainerAppsCluster } from './ContainerAppsCluster';
import { Project } from './Project';
interface Registry {
  server: string;
  username: string;
  password: string;
}

interface Image {
  name: string;
  tag: string;
  registry?: Registry;
}

interface Vault {
  resourceGroupName: string;
  name: string;
}

interface RawContainerArgs {
  name: string;
  image: string;
  env: Record<string, string | Input<string>>;
  volumes?: Record<string, Volume>;
}

interface Volume {
  storage: ManagedEnvironmentsStorage;
  path: string;
}

interface APIArgs {
  project: Project;
  cluster: ContainerAppsCluster;
  name: string;

  env: Record<string, string | Input<string>>;
  image: Image | string;
  command?: Input<string>[];
  size: Size;

  vaults?: Vault[];

  port?: number;
  scale: {
    min: number;
    max: number;
    noOfRequestsPerInstance: number;
  };
  volumes?: Record<string, Volume>;
  sidecars?: RawContainerArgs[];
  subdomain?: string;
}

interface RegistryArgs {
  server: string;
  username: string;
  passwordSecretRef: `${string}-pwd`;
}

interface SecretArgs {
  name: `${string}-pwd`;
  value: string;
}

interface SystemAssignedIdentity {
  principalId: string;
  tenantId: string;
  type: 'SystemAssigned';
}

const getName = (image: Image | string) => {
  if (typeof image === 'string') return image;
  if (!image.registry) return `${image.name}:${image.tag}`;
  return `${image.registry.server}/${image.name}:${image.tag}`;
};

const getSidecarContainers = (sidecars?: RawContainerArgs[]) => {
  if (!sidecars) return [];

  return sidecars.map(sidecar => ({
    name: sidecar.name,
    image: sidecar.image,
    env: [
      ...Object.entries(sidecar.env).map(([name, value]) => {
        return {
          name,
          value: output(value).apply(v => v || `WARNING: unknown value for ${name}`)
        };
      })
    ],
    volumeMounts: getVolumeMounts(sidecar.volumes),
    resources: {
      cpu: 1,
      memory: '2.0Gi'
    }
  }));
};

const getVolumeMounts = (volumes?: Record<string, Volume>) => {
  if (!volumes) return [];

  return Object.entries(volumes).map(([name, volume]) => ({
    volumeName: name,
    mountPath: volume.path
  }));
};

const getStorageConnections = (volumes?: Record<string, Volume>) => {
  if (!volumes) return [];

  return Object.entries(volumes).map(([name, volume]) => ({
    name,
    storageName: volume.storage.name,
    storageType: 'AzureFile'
  }));
};

const getCustomDomains = (project: Project, cluster: ContainerAppsCluster, subdomain?: string) => {
  if (!subdomain) return [];
  if (!project.zone) throw new Error('No zone found');
  if (!cluster.certificate) throw new Error('No certificate found');

  return [
    {
      name: interpolate`${subdomain}.${project.zone.name}`,
      certificateId: cluster.certificate.id,
      bindingType: BindingType.SniEnabled
    }
  ];
};

type Size = 'micro' | 'regular' | 'large';

const getResources = (size: Size) => {
  if (size === 'micro') return { cpu: 0.25, memory: '0.5Gi' };
  if (size === 'regular') return { cpu: 1, memory: '2.0Gi' };
  if (size === 'large') return { cpu: 2, memory: '4.0Gi' };
  throw new Error(`Unknown size: ${size}`);
};

export class API extends ComponentResource {
  public readonly defaultUrl: Output<string>;
  public readonly defaultHost: Output<string>;
  public readonly identity: Output<SystemAssignedIdentity>;
  public readonly api: ContainerApp;
  public readonly validationRecord?: CloudflareRecord;
  public readonly record?: CloudflareRecord;
  constructor(id: string, args: APIArgs, opts?: ResourceOptions) {
    super('sprinkle:index:API', id, args, opts);

    const registries: RegistryArgs[] = [];
    const secrets: SecretArgs[] = [];

    const subscriptionId = getClientConfig().then(c => c.subscriptionId);

    if (typeof args.image === 'object' && args.image.registry) {
      registries.push({
        server: args.image.registry.server,
        username: args.image.registry.username,
        passwordSecretRef: `${id}-pwd`
      });
      secrets.push({ name: `${id}-pwd`, value: args.image.registry.password });
    }

    if (args.project.zone && args.subdomain) {
      this.validationRecord = new CloudflareRecord(
        `${id}-dns-validation`,
        {
          zoneId: args.project.zone.id,
          name: `asuid.${args.subdomain}`,
          type: 'TXT',
          proxied: false,
          content: args.cluster.verificationId
        },
        { parent: this }
      );
    }

    const api = new ContainerApp(
      `${id}`,
      {
        resourceGroupName: args.project.group.name,
        managedEnvironmentId: args.cluster.environment.id,
        identity: {
          type: 'SystemAssigned'
        },
        configuration: {
          ingress: args.port
            ? {
                external: true,
                targetPort: args.port,
                customDomains: getCustomDomains(args.project, args.cluster, args.subdomain),
                corsPolicy: {
                  allowedOrigins: ['*'],
                  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                  allowedHeaders: ['*'],
                  exposeHeaders: ['*'],
                  allowCredentials: true
                }
              }
            : undefined,
          registries,
          secrets
        },
        template: {
          containers: [
            {
              name: args.name,
              image: getName(args.image),
              resources: getResources(args.size),
              env: [
                ...Object.entries(args.env).map(([name, value]) => {
                  return {
                    name,
                    value: output(value).apply(v => v || `WARNING: unknown value for ${name}`)
                  };
                }),
                {
                  name: 'NODE_ENV',
                  value: 'production'
                },
                ...(args.port ? [{ name: 'PORT', value: args.port.toString() }] : [])
              ],
              volumeMounts: [...getVolumeMounts(args.volumes), { volumeName: 'tmp', mountPath: '/tmp' }],
              command: args.command
            },
            ...getSidecarContainers(args.sidecars)
          ],
          scale: {
            maxReplicas: args.scale.max,
            minReplicas: args.scale.min,
            rules: [
              {
                custom: {
                  metadata: {
                    concurrentRequests: args.scale.noOfRequestsPerInstance.toString()
                  },
                  type: 'http'
                },
                name: 'httpscalingrule'
              }
            ]
          },
          volumes: [...getStorageConnections(args.volumes), { name: 'tmp', storageType: 'EmptyDir' }]
        }
      },
      { parent: this }
    );

    if (args.subdomain && args.project.zone) {
      this.record = new CloudflareRecord(
        `${id}-dns`,
        {
          zoneId: args.project.zone.id,
          name: args.subdomain,
          type: 'CNAME',
          proxied: true,
          content: interpolate`${api.name}.${args.cluster.environment.defaultDomain}`
        },
        { parent: this }
      );

      this.defaultHost = this.record.hostname;
      this.defaultUrl = interpolate`https://${this.defaultHost}`;
    } else {
      this.defaultHost = interpolate`${api.name}.${args.cluster.environment.defaultDomain}`;
      this.defaultUrl = interpolate`https://${this.defaultHost}`;
    }

    this.api = api;
    this.identity = api.identity.apply(i => {
      if (!i) throw new Error('No identity found');
      if (i.type !== 'SystemAssigned') throw new Error('Identity is not system assigned');
      if (!i.principalId) throw new Error('No principal ID found');
      if (!i.tenantId) throw new Error('No tenant ID found');
      return i as SystemAssignedIdentity;
    });

    args.vaults?.forEach(config => {
      new RoleAssignment(
        `${id}-kv-role-assignment`,
        {
          principalId: this.identity.principalId,
          principalType: PrincipalType.ServicePrincipal,
          roleDefinitionId: '/providers/Microsoft.Authorization/roleDefinitions/4633458b-17de-408a-b874-0445c86b69e6',
          scope: interpolate`/subscriptions/${subscriptionId}/resourceGroups/${config.resourceGroupName}/providers/Microsoft.KeyVault/vaults/${config.name}`
        },
        { parent: this }
      );
    });

    this.registerOutputs();
  }
}
