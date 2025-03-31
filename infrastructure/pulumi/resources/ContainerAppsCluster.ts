import { Certificate, ManagedEnvironment, ManagedEnvironmentsStorage } from '@pulumi/azure-native/app';
import { getCustomDomainVerificationIdOutput } from '@pulumi/azure-native/app/getCustomDomainVerificationId';
import { getSharedKeysOutput, GetSharedKeysResult } from '@pulumi/azure-native/operationalinsights/getSharedKeys';
import { FileShare, StorageAccount } from '@pulumi/azure-native/storage';
import { listStorageAccountKeysOutput } from '@pulumi/azure-native/storage/listStorageAccountKeys';
import { ListStorageAccountKeysResult } from '@pulumi/azure-native/storage/v20220901';
import { ComponentResource, Output, ResourceOptions } from '@pulumi/pulumi';
import { Project } from './Project';

interface ContainerAppsEnvironmentArgs {
  project: Project;
  storage?: StorageAccount;
}

export class ContainerAppsCluster extends ComponentResource {
  public readonly environment: ManagedEnvironment;
  public readonly storage?: ManagedEnvironmentsStorage;
  public readonly share?: FileShare;
  public readonly verificationId: Output<string>;
  public readonly certificate?: Certificate;

  constructor(id: string, args: ContainerAppsEnvironmentArgs, opts?: ResourceOptions) {
    super('sprinkle:index:ContainerAppsEnvironment', id, args, opts);

    const { group, workspace } = args.project;
    const workspaceSharedKey = getSharedKeysOutput({
      resourceGroupName: group.name,
      workspaceName: workspace.name
    }).apply((r: GetSharedKeysResult) => {
      if (!r.primarySharedKey) throw new Error('Primary shared key not found');
      return r.primarySharedKey;
    });

    this.environment = new ManagedEnvironment(
      `${id}-env`,
      {
        resourceGroupName: group.name,
        appLogsConfiguration: {
          destination: 'log-analytics',
          logAnalyticsConfiguration: {
            customerId: workspace.customerId,
            sharedKey: workspaceSharedKey
          }
        }
      },
      { parent: this }
    );

    if (args.project.cloudflare) {
      this.certificate = new Certificate(
        `${id}-cert`,
        {
          resourceGroupName: group.name,
          environmentName: this.environment.name,
          certificateName: 'cf-origin',
          properties: {
            value: args.project.cloudflare.originCertificate,
            password: args.project.cloudflare.originCertificatePassword
          }
        },
        { parent: this }
      );
    }

    this.verificationId = getCustomDomainVerificationIdOutput().apply(v => {
      if (!v.value) throw new Error('No verification ID found');
      return v.value;
    });

    if (args.storage) {
      this.share = new FileShare(
        `${id}-share`,
        {
          resourceGroupName: group.name,
          accountName: args.storage.name
        },
        { parent: this }
      );

      const key = listStorageAccountKeysOutput({
        resourceGroupName: group.name,
        accountName: args.storage.name
      }).apply((r: ListStorageAccountKeysResult) => {
        if (!r.keys[0].value) throw new Error('Primary key not found');
        return r.keys[0].value;
      });

      this.storage = new ManagedEnvironmentsStorage(`${id}-cache`, {
        resourceGroupName: group.name,
        environmentName: this.environment.name,
        properties: {
          azureFile: {
            accountName: args.storage.name,
            shareName: this.share!.name,
            accessMode: 'ReadWrite',
            accountKey: key
          }
        }
      });
    }
    this.registerOutputs();
  }
}
