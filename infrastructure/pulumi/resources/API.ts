import { BindingType, ContainerApp, ManagedEnvironmentsStorage } from '@pulumi/azure-native/app';
import { getManagedEnvironment } from '@pulumi/azure-native/app/getManagedEnvironment';
import { PrincipalType, RoleAssignment, getClientConfig } from '@pulumi/azure-native/authorization';

import { ComponentResource, Input, Output, ResourceOptions, all, interpolate, output } from '@pulumi/pulumi';

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
}

interface Volume {
  storage: ManagedEnvironmentsStorage;
  path: string;
}

interface APIArgs {
  resourceGroupName: Input<string>;
  environmentName: Input<string>;
  name: string;

  env: Record<string, string | Input<string>>;
  image: Image | string;

  vaults?: Vault[];

  port?: number;
  scale: {
    min: number;
    max: number;
    noOfRequestsPerInstance: number;
  };
  volumes?: Record<string, Volume>;
  sidecars?: RawContainerArgs[];
  domain?: {
    domain: string;
    certificateName: string;
  };
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

const getCustomDomains = (
  subscriptionId: Input<string>,
  resourceGroupName: Input<string>,
  environmentName: Input<string>,
  domain?: { domain: string; certificateName: string }
) => {
  if (!domain) return [];

  return [
    {
      name: domain.domain,
      certificateId: interpolate`/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.App/managedEnvironments/${environmentName}/managedCertificates/${domain.certificateName}`,
      bindingType: BindingType.SniEnabled
    }
  ];
};

export class API extends ComponentResource {
  public readonly resourceGroupName: Input<string>;
  public readonly environmentName: Input<string>;
  public readonly defaultUrl: Output<string>;
  public readonly identity: Output<SystemAssignedIdentity>;

  constructor(id: string, args: APIArgs, opts?: ResourceOptions) {
    super('si:index:API', id, args, opts);

    const registries: RegistryArgs[] = [];
    const secrets: SecretArgs[] = [];

    const environment = all([args.environmentName, args.resourceGroupName]).apply(
      ([environmentName, resourceGroupName]) =>
        getManagedEnvironment({
          resourceGroupName,
          environmentName
        })
    );
    const subscriptionId = getClientConfig().then(c => c.subscriptionId);

    if (typeof args.image === 'object' && args.image.registry) {
      registries.push({
        server: args.image.registry.server,
        username: args.image.registry.username,
        passwordSecretRef: `${id}-pwd`
      });
      secrets.push({ name: `${id}-pwd`, value: args.image.registry.password });
    }

    const api = new ContainerApp(
      `${id}`,
      {
        resourceGroupName: args.resourceGroupName,
        managedEnvironmentId: environment.id,
        identity: {
          type: 'SystemAssigned'
        },
        configuration: {
          ingress: args.port
            ? {
                external: true,
                targetPort: args.port,
                customDomains: getCustomDomains(subscriptionId, args.resourceGroupName, environment.name, args.domain)
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
              resources: {
                cpu: 1,
                memory: '2.0Gi'
              },
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
              volumeMounts: getVolumeMounts(args.volumes)
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
          volumes: getStorageConnections(args.volumes)
        }
      },
      { parent: this }
    );

    const defaultUrl = interpolate`https://${api.name}.${environment.defaultDomain}`;

    this.resourceGroupName = args.resourceGroupName;
    this.environmentName = environment.name;
    this.defaultUrl = defaultUrl;
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
