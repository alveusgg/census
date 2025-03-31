import { ComponentResource, Input, interpolate, jsonStringify, Output, ResourceOptions } from '@pulumi/pulumi';

export interface WorkerConfigArgs {
  account_id: Input<string>;
  name: Input<string>;
  env: string;
  main: string;
  vars?: Record<string, Input<string>>;
  durable_objects?: Input<{
    bindings: Input<
      {
        class_name: Input<string>;
        name: Input<string>;
      }[]
    >;
  }>;
  migrations?: Input<
    {
      tag: Input<string>;
      new_classes: Input<string[]>;
    }[]
  >;
  routes?: Input<
    {
      custom_domain: Input<boolean>;
      pattern: Input<string>;
    }[]
  >;
}

export class WorkerConfig extends ComponentResource {
  wranglerConfig: Output<string>;
  hostname: Output<string>;
  name: Output<string>;

  constructor(id: string, args: WorkerConfigArgs, opts?: ResourceOptions) {
    super(`sprinkle:index:WorkerConfig`, id, args, opts);

    this.name = interpolate`${args.name}-${args.env}`;
    this.wranglerConfig = jsonStringify({
      compatibility_date: '2024-07-01',
      main: args.main,
      workers_dev: false,
      env: {
        [args.env]: {
          vars: args.vars,
          account_id: args.account_id,
          durable_objects: args.durable_objects,
          migrations: args.migrations,
          name: this.name,
          routes: args.routes
        }
      }
    });

    this.hostname = this.wranglerConfig.apply(config => {
      const routes = JSON.parse(config).env[args.env].routes;
      if (!routes || routes.length === 0) {
        throw new Error('No routes found');
      }
      return routes[0].pattern as string;
    });
  }
}
