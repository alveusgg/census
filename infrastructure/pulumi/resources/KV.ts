import { ApiToken, WorkersKvNamespace } from '@pulumi/cloudflare';
import { ComponentResource, ResourceOptions } from '@pulumi/pulumi';

interface KVArgs {
  accountId: string;
}

export class KV extends ComponentResource {
  public readonly namespace: WorkersKvNamespace;
  public readonly token: ApiToken;

  constructor(id: string, args: KVArgs, opts?: ResourceOptions) {
    super('sprinkle:index:KV', id, args, opts);

    const namespace = new WorkersKvNamespace(
      `${id}-namespace`,
      {
        accountId: args.accountId,
        title: id
      },
      { parent: this }
    );

    const token = new ApiToken(
      `${id}-token`,
      {
        name: `${id}-token`,
        policies: [
          {
            effect: 'allow',
            permissionGroups: ['8b47d2786a534c08a1f94ee8f9f599ef', 'f7f0eda5697f475c90846e879bab8666'],
            resources: {
              [`com.cloudflare.api.account.${args.accountId}`]: '*'
            }
          }
        ]
      },
      { parent: this }
    );

    this.namespace = namespace;
    this.token = token;

    this.registerOutputs();
  }
}
