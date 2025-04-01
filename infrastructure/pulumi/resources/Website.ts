import {
  ClientPortOperator,
  CustomDomain,
  DestinationProtocol,
  Endpoint,
  Profile,
  QueryStringCachingBehavior,
  RedirectType,
  SkuName
} from '@pulumi/azure-native/cdn';
import { all, ComponentResource, Input, Output, ResourceOptions } from '@pulumi/pulumi';

import { getCustomDomainOutput } from '@pulumi/azure-native/cdn/getCustomDomain';
import {
  BlobServiceProperties,
  Kind,
  StorageAccount,
  StorageAccountStaticWebsite,
  SkuName as StorageSkuName
} from '@pulumi/azure-native/storage';
import { cdn } from '@pulumi/azure-native/types/input';
import { Record as CloudflareRecord } from '@pulumi/cloudflare';
import { Project } from './Project';
export interface WebsiteArgs {
  project: Project;
  type: 'spa' | 'mpa';
  subdomain: string;
}

const enforceHTTPSRule: cdn.DeliveryRuleArgs = {
  name: 'EnforceHTTPS',
  order: 1,
  conditions: [
    {
      name: 'RequestScheme',
      parameters: {
        matchValues: ['HTTP'],
        operator: ClientPortOperator.Equal,
        negateCondition: false,
        transforms: [],
        typeName: 'DeliveryRuleRequestSchemeConditionParameters'
      }
    }
  ],
  actions: [
    {
      name: 'UrlRedirect',
      parameters: {
        redirectType: RedirectType.Found,
        destinationProtocol: DestinationProtocol.Https,
        typeName: 'DeliveryRuleUrlRedirectActionParameters'
      }
    }
  ]
};

const spaRewriteRule: cdn.DeliveryRuleArgs = {
  name: 'SPARewrite',
  order: 2,
  conditions: [
    {
      name: 'UrlFileExtension',
      parameters: {
        operator: ClientPortOperator.GreaterThan,
        negateCondition: true,
        matchValues: ['0'],
        typeName: 'DeliveryRuleUrlFileExtensionMatchConditionParameters'
      }
    }
  ],
  actions: [
    {
      name: 'UrlRewrite',
      parameters: {
        sourcePattern: '/',
        destination: '/index.html',
        preserveUnmatchedPath: false,
        typeName: 'DeliveryRuleUrlRewriteActionParameters'
      }
    }
  ]
};

export interface IWebsite {
  readonly endpoint: Input<string>;
  readonly accountName: Input<string>;
  readonly containerName: Input<string>;
  readonly endpointName: Input<string>;
  readonly profileName: Input<string>;
  readonly resourceGroupName: Input<string>;
}

export class Website extends ComponentResource implements IWebsite {
  public readonly endpoint: Output<string>;
  public readonly accountName: Output<string>;
  public readonly containerName: Output<string>;
  public readonly endpointName: Output<string>;
  public readonly profileName: Output<string>;
  public readonly blobEndpoint: Output<string>;
  public readonly resourceGroupName: Output<string>;

  constructor(id: string, args: WebsiteArgs, opts?: ResourceOptions) {
    super('sprinkle:index:Website', id, args, opts);

    if (!args.project.zone) throw new Error('No zone found');
    if (!args.project.cloudflare) throw new Error('No cloudflare config found');

    const simpleId = id.replace(/-/g, '');

    const profile = new Profile(
      `${id}-profile`,
      {
        resourceGroupName: args.project.group.name,
        location: 'global',
        sku: {
          name: SkuName.Standard_Microsoft
        }
      },
      { parent: this }
    );

    const storageAccount = new StorageAccount(
      simpleId,
      {
        enableHttpsTrafficOnly: true,
        kind: Kind.StorageV2,
        resourceGroupName: args.project.group.name,
        sku: {
          name: StorageSkuName.Standard_LRS
        }
      },
      { parent: this }
    );

    new BlobServiceProperties(
      `${simpleId}-blob-service-properties`,
      {
        accountName: storageAccount.name,
        blobServicesName: 'default',
        resourceGroupName: args.project.group.name,
        cors: {
          corsRules: [
            {
              allowedHeaders: ['*'],
              allowedMethods: ['GET'],
              allowedOrigins: ['*'],
              exposedHeaders: ['*'],
              maxAgeInSeconds: 3600
            }
          ]
        }
      },
      { parent: this }
    );

    const staticWebsite = new StorageAccountStaticWebsite(
      `${id}-static`,
      {
        accountName: storageAccount.name,
        resourceGroupName: args.project.group.name,
        indexDocument: 'index.html',
        error404Document: 'index.html'
      },
      { parent: this }
    );

    const endpointOrigin = storageAccount.primaryEndpoints.apply(ep => ep.web.replace('https://', '').replace('/', ''));

    const rules = [enforceHTTPSRule];

    if (args.type === 'spa') {
      rules.push(spaRewriteRule);
    }

    const endpoint = new Endpoint(
      `${id}-endpoint`,
      {
        endpointName: storageAccount.name.apply(sa => `cdn-endpnt-${sa}`),
        location: 'global',
        isHttpAllowed: false,
        isHttpsAllowed: true,
        originHostHeader: endpointOrigin,
        origins: [
          {
            hostName: endpointOrigin,
            httpsPort: 443,
            name: 'origin-storage-account'
          }
        ],
        profileName: profile.name,
        queryStringCachingBehavior: QueryStringCachingBehavior.NotSet,
        resourceGroupName: args.project.group.name,
        deliveryPolicy: { rules }
      },
      { parent: this }
    );

    const record = new CloudflareRecord(`${id}-dns`, {
      name: args.subdomain,
      type: 'CNAME',
      zoneId: args.project.zone.id,
      proxied: false,
      content: endpoint.hostName
    });

    const customDomain = new CustomDomain(
      `${id}-custom-domain`,
      {
        endpointName: endpoint.name,
        hostName: record.hostname,
        profileName: profile.name,
        resourceGroupName: args.project.group.name
      },
      { parent: this }
    );

    all([customDomain.name, endpoint.name, profile.name, args.project.group.name]).apply(
      ([customDomainName, endpointName, profileName, resourceGroupName]) =>
        getCustomDomainOutput({
          resourceGroupName,
          customDomainName,
          endpointName,
          profileName
        }).apply(domain => {
          if (domain.customHttpsProvisioningState === 'Disabled') {
            console.log('Unfortunately, you must manually enable custom domain HTTPs for this profile.');
            console.log('You just need to turn the "Custom domain HTTPS" toggle to "On" in the Azure portal.');
          }
        })
    );

    this.endpoint = record.hostname.apply(hn => `https://${hn}`);
    this.blobEndpoint = storageAccount.primaryEndpoints.web;
    this.accountName = storageAccount.name;
    this.containerName = staticWebsite.containerName;
    this.endpointName = endpoint.name;
    this.profileName = profile.name;
    this.resourceGroupName = args.project.group.name;

    this.registerOutputs();
  }
}
