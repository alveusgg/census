import { Blob } from '@pulumi/azure-native/storage';
import { ComponentResource, Input, interpolate, jsonStringify, Output, ResourceOptions } from '@pulumi/pulumi';
import { StringAsset } from '@pulumi/pulumi/asset';

export interface BackstageConfigurationArgs {
  readonly resourceGroupName: Input<string>;
  readonly accountName: Input<string>;
  readonly containerName: Input<string>;
  readonly endpoint: Input<string>;
  readonly blobEndpoint: Input<string>;

  readonly env: { variables: Record<string, Input<string> | undefined>; flags: Record<string, boolean> };
}

export class BackstageConfiguration extends ComponentResource {
  public readonly url: Output<string>;

  constructor(id: string, args: BackstageConfigurationArgs, opts?: ResourceOptions) {
    super(`si:index:BackstageConfiguration`, id, args, opts);

    new Blob(
      `${id}-backstage-index`,
      {
        blobName: 'backstage.json',
        resourceGroupName: args.resourceGroupName,
        accountName: args.accountName,
        containerName: args.containerName,
        source: jsonStringify(args.env).apply(env => new StringAsset(env)),
        contentType: 'application/json'
      },
      { parent: this }
    );

    this.url = interpolate`${args.blobEndpoint}backstage.json`;
    this.registerOutputs();
  }
}
