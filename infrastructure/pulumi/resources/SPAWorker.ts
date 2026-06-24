import { ComponentResource, Input, interpolate, jsonStringify, output, Output, ResourceOptions } from '@pulumi/pulumi';
import { Buffer } from 'node:buffer';

export interface SPAWorkerArgs {
  account_id: Input<string>;
  name: Input<string>;
  env: string;
  route: Input<string>;
  assetsDirectory: Input<string>;
  backstage: {
    variables: Record<string, Input<string>>;
    flags: Record<string, Input<boolean>>;
  };
}

export class SPAWorker extends ComponentResource {
  wranglerConfig: Output<string>;
  workerSourceBase64: Output<string>;
  hostname: Output<string>;
  name: Output<string>;

  constructor(id: string, args: SPAWorkerArgs, opts?: ResourceOptions) {
    super(`sprinkle:index:SPAWorker`, id, args, opts);

    this.name = interpolate`${args.name}-${args.env}`;
    this.hostname = output(args.route);

    const workerSource = interpolate`export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isImageAsset = /\\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(url.pathname);

    if (url.pathname === '/backstage') {
      return Response.json({
        variables: ${jsonStringify(args.backstage.variables)},
        flags: ${jsonStringify(args.backstage.flags)}
      });
    }

    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('Content-Type') ?? '';

    if (response.ok && isImageAsset && contentType.startsWith('image/')) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    return response;
  }
};`;

    this.workerSourceBase64 = workerSource.apply(source => Buffer.from(source, 'utf8').toString('base64'));

    this.wranglerConfig = jsonStringify({
      compatibility_date: '2026-04-03',
      workers_dev: false,
      main: 'worker.generated.js',
      assets: {
        directory: args.assetsDirectory,
        binding: 'ASSETS',
        not_found_handling: 'single-page-application'
      },
      env: {
        [args.env]: {
          account_id: args.account_id,
          name: this.name,
          routes: [
            // {
            //   custom_domain: true,
            //   pattern: args.route
            // }
          ]
        }
      }
    });

    this.registerOutputs({
      wranglerConfig: this.wranglerConfig,
      workerSourceBase64: this.workerSourceBase64,
      hostname: this.hostname,
      name: this.name
    });
  }
}
