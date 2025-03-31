import { Configuration, FirewallRule, Server } from '@pulumi/azure-native/dbforpostgresql';
import { ComponentResource, Input, Output, ResourceOptions } from '@pulumi/pulumi';
import { RandomPassword, RandomString } from '@pulumi/random';

interface PostgreSQLFlexibleServerArgs {
  resourceGroupName: Input<string>;
  configuration?: Record<string, string>;
}

export class PostgreSQLFlexibleServer extends ComponentResource {
  public readonly resourceGroupName: Input<string>;
  public readonly host: Output<string>;
  public readonly administratorUsername: Output<string>;
  public readonly administratorPassword: Output<string>;
  public readonly name: Output<string>;

  constructor(id: string, args: PostgreSQLFlexibleServerArgs, opts?: ResourceOptions) {
    super('sprinkle:index:PostgreSQLFlexibleServer', id, args, opts);

    const username = new RandomString(
      `${id}-username`,
      {
        length: 8,
        special: false
      },
      { parent: this }
    );

    const password = new RandomPassword(
      `${id}-password`,
      {
        length: 20,
        special: false
      },
      { parent: this }
    );

    const server = new Server(
      `${id}-server`,
      {
        resourceGroupName: args.resourceGroupName,
        administratorLogin: username.result,
        administratorLoginPassword: password.result,
        version: '16',
        storage: {
          storageSizeGB: 32
        },
        sku: {
          tier: 'Burstable',
          name: 'Standard_B1ms'
        }
      },
      { parent: this }
    );

    for (const [key, value] of Object.entries(args.configuration ?? {})) {
      new Configuration(`${id}-db-wal-config`, {
        resourceGroupName: args.resourceGroupName,
        serverName: server.name,
        configurationName: key,
        source: 'user-override',
        value
      });
    }

    new FirewallRule(
      `${id}-azure-access`,
      {
        serverName: server.name,
        resourceGroupName: args.resourceGroupName,
        startIpAddress: '0.0.0.0',
        endIpAddress: '0.0.0.0'
      },
      { parent: this }
    );

    const name = server.fullyQualifiedDomainName.apply(fqdn => fqdn?.split('.')[0]);

    this.resourceGroupName = args.resourceGroupName;
    this.host = server.fullyQualifiedDomainName;
    this.administratorUsername = username.result;
    this.administratorPassword = password.result;
    this.name = name;

    this.registerOutputs();
  }
}
