import { AutoRouter, cors, error, IRequest } from 'itty-router';

// make sure our sync durable object is made available to cloudflare
export { TldrawDurableObject } from './TldrawDurableObject';

// we use itty-router (https://itty.dev/) to handle routing. in this example we turn on CORS because
// we're hosting the worker separately to the client. you should restrict this to your own domain.
const { preflight, corsify } = cors({ origin: '*' });
const router = AutoRouter<IRequest, [env: Env, ctx: ExecutionContext]>({
  before: [preflight],
  finally: [corsify],
  catch: e => {
    console.error(e);
    return error(e);
  }
})
  // requests to /connect are routed to the Durable Object, and handle realtime websocket syncing
  .get('/connect/:documentId', async (request, env) => {
    const token = request.query.accessToken as string;
    if (!token) return error(400, 'Missing token');

    const documentId = request.params.documentId;
    if (!documentId) return error(400, 'Missing documentId');

    const url = new URL(request.url);
    url.searchParams.set('baseUrl', env.API_BASE_URL);

    const id = env.TLDRAW_DURABLE_OBJECT.idFromName(documentId);
    const room = env.TLDRAW_DURABLE_OBJECT.get(id);
    return room.fetch(url, { headers: request.headers, body: request.body });
  });

// export our router for cloudflare
export default router;
