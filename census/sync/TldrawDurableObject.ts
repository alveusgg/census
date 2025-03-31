import { TLSocketRoom } from '@tldraw/sync-core';
import { TLRecord } from '@tldraw/tlschema';
import { AutoRouter, IRequest, error } from 'itty-router';
import Throttle from 'p-throttle';

import type { AppRouter } from '@alveusgg/census-api';

import { createTRPCClient, httpLink } from '@trpc/client';
import { SuperJSON } from 'superjson';

const throttle = Throttle({
  limit: 1,
  interval: 5_000
});

const createClient = (url: string, key: string) => {
  return createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url,
        headers: ctx => {
          const headers = new Headers({
            Authorization: `ApiKey ${key}`
          });

          if (ctx.op.context.accessToken) {
            headers.set('x-impersonate-user', `Bearer ${ctx.op.context.accessToken}`);
          }

          return headers;
        },
        transformer: SuperJSON
      })
    ]
  });
};

type Client = ReturnType<typeof createClient>;

// each whiteboard room is hosted in a DurableObject:
// https://developers.cloudflare.com/durable-objects/

// there's only ever one durable object instance per room. it keeps all the room state in memory and
// handles websocket connections. periodically, it persists the room state to the R2 bucket.
export class TldrawDurableObject {
  // the room ID will be missing while the room is being initialized
  private documentId: string | null = null;
  // when we load the room from the R2 bucket, we keep it here. it's a promise so we only ever
  // load it once.
  private roomPromise: Promise<TLSocketRoom<TLRecord, void>> | null = null;
  private client: Client;

  constructor(
    private readonly ctx: DurableObjectState,
    private readonly env: Env
  ) {
    this.client = createClient(this.env.API_BASE_URL, this.env.WORKER_API_TOKEN);
    ctx.blockConcurrencyWhile(async () => {
      this.documentId = ((await this.ctx.storage.get('documentId')) ?? null) as string | null;
    });
  }

  private readonly router = AutoRouter({
    catch: e => {
      console.log(e);
      return error(e);
    }
  })
    // when we get a connection request, we stash the room id if needed and handle the connection
    .get('/connect/:documentId', async request => {
      if (!this.documentId) {
        await this.ctx.blockConcurrencyWhile(async () => {
          await this.ctx.storage.put('documentId', request.params.documentId);
          this.documentId = request.params.documentId;
        });
      }

      return this.handleConnect(request);
    });

  // `fetch` is the entry point for all requests to the Durable Object
  fetch(request: Request): Response | Promise<Response> {
    return this.router.fetch(request);
  }

  // what happens when someone tries to connect to this room?
  async handleConnect(request: IRequest): Promise<Response> {
    // extract query params from request
    const sessionId = request.query.sessionId as string;
    if (!sessionId) return error(400, 'Missing sessionId');

    // check user access token
    const accessToken = request.query.accessToken as string;
    if (!accessToken) return error(400, 'Missing accessToken');

    // const hasAccess = await this.client.guides.document.checkWriteAccess.mutate(
    //   { id: this.documentId },
    //   {
    //     context: {
    //       accessToken
    //     }
    //   }
    // );
    // if (!hasAccess) return error(403, 'User does not have write access to this document');

    // Create the websocket pair for the client
    const { 0: clientWebSocket, 1: serverWebSocket } = new WebSocketPair();
    serverWebSocket.accept();

    // load the room, or retrieve it if it's already loaded
    const room = await this.getRoom();
    // connect the client to the room
    room.handleSocketConnect({ sessionId, socket: serverWebSocket });

    // return the websocket connection to the client
    return new Response(null, { status: 101, webSocket: clientWebSocket });
  }

  getRoom() {
    const documentId = this.documentId;
    if (!documentId) throw new Error('Missing documentId');

    if (!this.roomPromise) {
      this.roomPromise = (async () => {
        if (!this.client) throw new Error('Missing client');
        const document = await this.client.guides.document.getById.query({ id: documentId });
        if (!document) throw new Error('Document not found');

        // create a new TLSocketRoom. This handles all the sync protocol & websocket connections.
        // it's up to us to persist the room state to R2 when needed though.
        return new TLSocketRoom<TLRecord, void>({
          initialSnapshot: document.content ?? undefined,
          onDataChange: () => {
            // and persist whenever the data in the room changes
            this.schedulePersistToAPI();
          }
        });
      })();
    }

    return this.roomPromise;
  }

  schedulePersistToAPI = throttle(async () => {
    if (!this.roomPromise || !this.documentId || !this.client) return;
    const room = await this.getRoom();

    const snapshot = room.getCurrentSnapshot();
    await this.client.guides.document.update.mutate({ id: this.documentId, snapshot });
  });
}
