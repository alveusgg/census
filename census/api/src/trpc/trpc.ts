import { CustomError, ForbiddenError, NotAuthenticatedError } from '@alveusgg/error';
import { context } from '@opentelemetry/api';
import {
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_STATUS_CODE,
  SEMATTRS_HTTP_URL
} from '@opentelemetry/semantic-conventions';
import * as Sentry from '@sentry/node';
import { initTRPC, TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { flatten } from 'flat';
import { createRemoteJWKSet, errors as joseErrors, jwtVerify } from 'jose';
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

type AuthProvider = ReturnType<typeof createRemoteJWKSet>;

const fetchAuthProvider = async (configuredIssuer: string): Promise<AuthProvider> => {
  const response = await fetch(new URL('/.well-known/oauth-authorization-server', configuredIssuer));
  if (!response.ok) {
    throw new NotAuthenticatedError('Could not reach the authentication provider to verify your token.');
  }

  const data = await response.json();
  const provider = AlveusAuthProviderMetadata.parse(data);

  return createRemoteJWKSet(new URL(provider.jwks_uri, provider.issuer), {
    cacheMaxAge: 10 * 60 * 1000,
    cooldownDuration: 30_000,
    timeoutDuration: 5_000
  });
};

let authProvider: Promise<AuthProvider> | undefined;

const getAuthProvider = async (): Promise<AuthProvider> => {
  const { variables } = useEnvironment();

  if (!authProvider) {
    authProvider = fetchAuthProvider(variables.ALVEUS_AUTH_ISSUER);
  }

  return await authProvider;
};

const validateJWT = async (token: string) => {
  const { variables } = useEnvironment();

  try {
    const jwks = await getAuthProvider();
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['RS256'],
      issuer: variables.ALVEUS_AUTH_ISSUER,
      // Absorb small clock drift between the client that minted/checked the
      // token and this server; anything larger is a real expiry and should fail.
      clockTolerance: '30s'
    });

    return {
      subject: payload.sub,
      payload
    };
  } catch (error) {
    console.error('error', error);
    if (error instanceof joseErrors.JWTExpired) {
      throw new NotAuthenticatedError('Your token has expired.');
    }
    if (error instanceof joseErrors.JWTClaimValidationFailed) {
      throw new NotAuthenticatedError(`Your token has an invalid claim: ${error.claim} (${error.reason}).`);
    }
    if (error instanceof joseErrors.JWSSignatureVerificationFailed) {
      throw new NotAuthenticatedError('Your token signature could not be verified.');
    }
    if (error instanceof joseErrors.JWKSNoMatchingKey) {
      throw new NotAuthenticatedError('Your token was signed with an unknown key.');
    }
    if (error instanceof joseErrors.JOSEError) {
      throw new NotAuthenticatedError(`Your token could not be verified: ${error.code}.`);
    }
    throw new NotAuthenticatedError('Your token could not be verified.');
  }
};

const loggedProcedure = t.procedure.use(async opts => {
  const sentryTrace = opts.ctx.req.headers['sentry-trace'] as string | undefined;
  const baggage = opts.ctx.req.headers['baggage'] as string | undefined;

  return Sentry.continueTrace({ sentryTrace, baggage }, () =>
    Sentry.startSpan(
      {
        name: opts.path,
        op: `trpc.${opts.type}`,
        forceTransaction: true,
        attributes: {
          [SEMATTRS_HTTP_METHOD]: 'HTTP',
          [SEMATTRS_HTTP_URL]: opts.path,
          path: opts.path,
          type: opts.type
        }
      },
      async span => {
        const result = await opts.next();
        const rawInput = await opts.getRawInput();
        if (typeof rawInput === 'object' && (opts.type === 'query' || opts.type === 'subscription')) {
          span.setAttributes(flatten({ input: SuperJSON.serialize(rawInput).json }));
        }
        span.setAttributes({
          ok: result.ok,
          [SEMATTRS_HTTP_STATUS_CODE]: result.ok ? 200 : 500
        });
        // 1 = OK, 2 = ERROR (OpenTelemetry status codes used by Sentry).
        span.setStatus({ code: result.ok ? 1 : 2, message: result.ok ? 'ok' : 'internal_error' });

        if (!result.ok && result.error) {
          if (result.error.cause instanceof CustomError) {
            result.error = new TRPCError({
              code: result.error.cause.category,
              message: JSON.stringify(result.error.cause.toJSON()),
              cause: result.error.cause
            });
          }

          Sentry.captureException(result.error, {
            mechanism: { type: 'trpc', handled: false },
            captureContext: {
              contexts: {
                trpc: {
                  path: opts.path,
                  type: opts.type,
                  code: result.error.code
                }
              }
            }
          });
        }

        return result;
      }
    )
  );
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
    // Preserve the specific auth failure reason; only wrap unexpected errors
    // (e.g. downstream user lookup failures) as a generic auth error.
    if (error instanceof NotAuthenticatedError) throw error;
    throw new NotAuthenticatedError('Your token could not be authenticated.');
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
