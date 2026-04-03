import { CustomError, ForbiddenError, NotAuthenticatedError } from '@alveusgg/error';
import { context, propagation, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import {
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_STATUS_CODE,
  SEMATTRS_HTTP_URL
} from '@opentelemetry/semantic-conventions';
import { initTRPC, TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { flatten } from 'flat';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import SuperJSON from 'superjson';
import { z } from 'zod';
import { feeds } from '../db/schema/index.js';
import { useDB } from '../db/transaction.js';
import { getPermissions, Permissions } from '../services/auth/role.js';
import { TokenPayload } from '../services/auth/router.js';
import { getUserByProviderId } from '../services/users/index.js';
import { useEnvironment, withUser } from '../utils/env/env.js';
import { createContext } from './context.js';

const t = initTRPC.context<typeof createContext>().create({ transformer: SuperJSON });
export const router = t.router;

const AlveusAuthProviderMetadata = z.object({
  issuer: z.string(),
  jwks_uri: z.string()
});

const AUTH_PROVIDER_CACHE_MS = 10 * 60 * 1000;
const AUTH_PROVIDER_TIMEOUT_MS = 5_000;

type AuthProvider = {
  issuer: string;
  jwks: ReturnType<typeof createRemoteJWKSet>;
  expiresAt: number;
};

let authProviderCache: AuthProvider | undefined;
let authProviderRequest: Promise<AuthProvider> | undefined;

const fetchAuthProvider = async (configuredIssuer: string): Promise<AuthProvider> => {
  const response = await fetch(new URL('/.well-known/oauth-authorization-server', configuredIssuer));
  if (!response.ok) {
    throw new NotAuthenticatedError('Your token not signed correctly');
  }

  const data = await response.json();
  const provider = AlveusAuthProviderMetadata.parse(data);

  return {
    issuer: provider.issuer,
    jwks: createRemoteJWKSet(new URL(provider.jwks_uri, provider.issuer), {
      cacheMaxAge: AUTH_PROVIDER_CACHE_MS,
      cooldownDuration: 30_000,
      timeoutDuration: AUTH_PROVIDER_TIMEOUT_MS
    }),
    expiresAt: Date.now() + AUTH_PROVIDER_CACHE_MS
  };
};

const getAuthProvider = async (): Promise<AuthProvider> => {
  const { variables } = useEnvironment();

  if (
    authProviderCache &&
    authProviderCache.issuer === variables.ALVEUS_AUTH_ISSUER &&
    authProviderCache.expiresAt > Date.now()
  ) {
    return authProviderCache;
  }

  if (!authProviderRequest) {
    authProviderRequest = fetchAuthProvider(variables.ALVEUS_AUTH_ISSUER);
  }

  try {
    authProviderCache = await authProviderRequest;
    return authProviderCache;
  } finally {
    authProviderRequest = undefined;
  }
};

const validateJWT = async (token: string) => {
  try {
    const { issuer, jwks } = await getAuthProvider();
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['RS256'],
      issuer
    });

    return {
      subject: payload.sub,
      payload
    };
  } catch (error) {
    console.error('error', error);
    throw new NotAuthenticatedError('Your token not signed correctly');
  }
};

const loggedProcedure = t.procedure.use(async opts => {
  const tracer = trace.getTracer('ApplicationInsightsTracer');
  const input = {
    traceparent: opts.ctx.req.headers['traceparent'] as string,
    tracestate: opts.ctx.req.headers['tracestate'] as string
  };

  const ctx = propagation.extract(context.active(), input);

  return tracer.startActiveSpan(`TRPC ${opts.type}`, { kind: SpanKind.SERVER }, ctx, async span => {
    const result = await opts.next();
    const input = await opts.getRawInput();
    if (typeof input === 'object') {
      span.setAttributes(flatten({ input: SuperJSON.serialize(input).json }));
    }
    const meta = { path: opts.path, type: opts.type, ok: result.ok };
    span.setAttributes({
      ...meta,
      [SEMATTRS_HTTP_METHOD]: 'HTTP',
      [SEMATTRS_HTTP_URL]: opts.path,
      [SEMATTRS_HTTP_STATUS_CODE]: result.ok ? 200 : 500
    });
    span.setStatus({ code: result.ok ? SpanStatusCode.OK : SpanStatusCode.ERROR });

    if (!result.ok && result.error) {
      if (result.error.cause instanceof CustomError) {
        result.error = new TRPCError({
          code: result.error.cause.category,
          message: JSON.stringify(result.error.cause.toJSON()),
          cause: result.error.cause
        });
      }

      span.recordException({
        code: result.error.code,
        message: result.error.message,
        name: result.error.name,
        stack: result.error.stack
      });
    }

    span.end();
    return result;
  });
});
export const publicProcedure = loggedProcedure;

export const procedure = loggedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.authorization) {
    throw new NotAuthenticatedError('You are not authenticated.');
  }
  const [type, token] = ctx.authorization.split(' ');
  if (type !== 'Bearer') {
    throw new NotAuthenticatedError('You are using an invalid authentication method.');
  }

  try {
    const decoded = await validateJWT(token);
    if (!decoded.subject) throw new NotAuthenticatedError('Your token is malformed as it does not have a subject.');
    const payload = TokenPayload.safeParse(decoded.payload);
    if (!payload.success)
      throw new NotAuthenticatedError(
        `Your token is malformed as it does not have the required payload: ${payload.error.message}`
      );
    const user = await getUserByProviderId(payload.data.sub);
    context.active().setValue(Symbol.for('ai.user.authUserId'), user.id);
    return withUser({ ...payload.data, ...user, points: ctx.points, achievements: ctx.achievements }, next);
  } catch (error) {
    console.error('error', error);
    throw new NotAuthenticatedError('Your token is malformed.');
  }
});

export const procedureWithPermissions = (required: keyof Permissions) => {
  return procedure.use(async ({ next }) => {
    const permissions = await getPermissions();
    if (!permissions[required]) {
      throw new ForbiddenError('You are not authorized to perform this action.');
    }
    return next();
  });
};

export const integrationProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.authorization) {
    throw new NotAuthenticatedError('You are not authenticated.');
  }
  const [type, token] = ctx.authorization.split(' ');
  if (type !== 'Basic') {
    throw new NotAuthenticatedError('You are using an invalid authentication method.');
  }

  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  const [username, password] = decoded.split(':');
  const db = useDB();
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, username));
  if (!feed || feed.key !== password) {
    throw new ForbiddenError('You are not authorized to perform this action.');
  }
  return next();
});
