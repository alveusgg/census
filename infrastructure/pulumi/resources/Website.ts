import {
  ClientPortOperator,
  DestinationProtocol,
  Endpoint,
  Profile,
  QueryStringCachingBehavior,
  RedirectType,
  SkuName
} from '@pulumi/azure-native/cdn';
import { ComponentResource, Input, Output, ResourceOptions } from '@pulumi/pulumi';

import {
  BlobServiceProperties,
  Kind,
  StorageAccount,
  StorageAccountStaticWebsite,
  SkuName as StorageSkuName
} from '@pulumi/azure-native/storage';
import { cdn } from '@pulumi/azure-native/types/input';

export interface WebsiteArgs {
  resourceGroupName: Input<string>;
  type: 'spa' | 'mpa';
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
  readonly resourceGroupName: Input<string>;
  readonly accountName: Input<string>;
  readonly containerName: Input<string>;
  readonly endpointName: Input<string>;
  readonly profileName: Input<string>;
}

export class Website extends ComponentResource implements IWebsite {
  public readonly endpoint: Output<string>;
  public readonly resourceGroupName: Input<string>;
  public readonly accountName: Output<string>;
  public readonly containerName: Output<string>;
  public readonly endpointName: Output<string>;
  public readonly profileName: Output<string>;
  public readonly blobEndpoint: Output<string>;

  constructor(id: string, args: WebsiteArgs, opts?: ResourceOptions) {
    super('si:index:Website', id, args, opts);

    const simpleId = id.replace(/-/g, '');
    const { resourceGroupName } = args;

    const profile = new Profile(
      `${id}-profile`,
      {
        resourceGroupName,
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
        resourceGroupName,
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
        resourceGroupName,
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
        resourceGroupName,
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
        resourceGroupName,
        deliveryPolicy: { rules }
      },
      { parent: this }
    );

    this.endpoint = endpoint.hostName.apply(hn => `https://${hn}`);
    this.blobEndpoint = storageAccount.primaryEndpoints.web;
    this.resourceGroupName = resourceGroupName;
    this.accountName = storageAccount.name;
    this.containerName = staticWebsite.containerName;
    this.endpointName = endpoint.name;
    this.profileName = profile.name;

    this.registerOutputs();
  }
}
