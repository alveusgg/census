import { Component, IngestionMode } from '@pulumi/azure-native/insights';
import { Workspace } from '@pulumi/azure-native/operationalinsights';
import { ResourceGroup } from '@pulumi/azure-native/resources';
import { GetZoneResult } from '@pulumi/cloudflare';

import { ComponentResource, Output, ResourceOptions } from '@pulumi/pulumi';

interface CloudflareArgs {
  zone: Output<GetZoneResult>;
  originCertificate: string;
  originCertificatePassword?: string;
}

interface ProjectArgs {
  cloudflare?: CloudflareArgs;
}

export class Project extends ComponentResource {
  public readonly group: ResourceGroup;
  public readonly workspace: Workspace;
  public readonly insights: Component;
  public readonly zone?: Output<GetZoneResult>;
  public readonly cloudflare?: CloudflareArgs;

  constructor(id: string, args?: ProjectArgs, opts?: ResourceOptions) {
    super('sprinkle:index:Project', id, args, opts);

    const group = new ResourceGroup(`${id}-group`, {}, { parent: this });

    this.zone = args?.cloudflare?.zone;
    this.cloudflare = args?.cloudflare;

    const workspace = new Workspace(
      `${id}-logs`,
      {
        resourceGroupName: group.name,
        sku: { name: 'PerGB2018' },
        retentionInDays: 30
      },
      { parent: this }
    );

    const insights = new Component(
      `${id}-insights`,
      {
        resourceGroupName: group.name,
        applicationType: 'web',
        kind: 'web',
        ingestionMode: IngestionMode.LogAnalytics,
        workspaceResourceId: workspace.id
      },
      { parent: this }
    );

    this.group = group;
    this.workspace = workspace;
    this.insights = insights;

    this.registerOutputs();
  }
}
