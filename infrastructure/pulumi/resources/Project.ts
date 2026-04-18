import { Component, IngestionMode } from '@pulumi/azure-native/insights';
import { Workspace } from '@pulumi/azure-native/operationalinsights';
import { ResourceGroup } from '@pulumi/azure-native/resources';
import { GetZoneResult, OriginCaCertificate } from '@pulumi/cloudflare';
import { all, ComponentResource, Output, ResourceOptions } from '@pulumi/pulumi';
import { CertRequest, PrivateKey } from '@pulumi/tls';

interface CloudflareArgs {
  zone: Output<GetZoneResult>;
}

interface ProjectCloudflare {
  zone: Output<GetZoneResult>;
  originCertificateBundle: Output<string>;
}

interface ProjectArgs {
  cloudflare?: CloudflareArgs;
}

export class Project extends ComponentResource {
  public readonly group: ResourceGroup;
  public readonly workspace: Workspace;
  public readonly insights: Component;
  public readonly zone?: Output<GetZoneResult>;
  public readonly cloudflare?: ProjectCloudflare;

  constructor(id: string, args?: ProjectArgs, opts?: ResourceOptions) {
    super('sprinkle:index:Project', id, args, opts);

    const group = new ResourceGroup(`${id}-group`, {}, { parent: this });

    this.zone = args?.cloudflare?.zone;

    if (args?.cloudflare?.zone) {
      const zone = args.cloudflare.zone;

      const key = new PrivateKey(
        `${id}-origin-key`,
        {
          algorithm: 'RSA',
          rsaBits: 2048
        },
        { parent: this }
      );

      const csr = new CertRequest(
        `${id}-origin-csr`,
        {
          privateKeyPem: key.privateKeyPem,
          subject: {
            commonName: zone.name
          }
        },
        { parent: this }
      );

      const cert = new OriginCaCertificate(
        `${id}-origin-cert`,
        {
          csr: csr.certRequestPem,
          hostnames: zone.name.apply(n => [`*.${n}`]),
          requestType: 'origin-rsa',
          requestedValidity: 5475
        },
        { parent: this }
      );

      const originCertificateBundle = all([cert.certificate, key.privateKeyPem]).apply(([c, k]) =>
        Buffer.from(`${c.trim()}\n${k.trim()}\n`).toString('base64')
      );

      this.cloudflare = {
        zone,
        originCertificateBundle
      };
    }

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
