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
import { validateJWT as originalValidateJWT } from 'oslo/jwt';
import SuperJSON from 'superjson';
import { feeds } from '../db/schema/index.js';
import { useDB } from '../db/transaction.js';
import { getPermissions, Permissions } from '../services/auth/role.js';
import { TokenPayload } from '../services/auth/router.js';
import { useEnvironment, useUser, withUser } from '../utils/env/env.js';
import { createContext } from './context.js';

const t = initTRPC.context<typeof createContext>().create({ transformer: SuperJSON });
export const router = t.router;

const validateJWT = async (token: string) => {
  const { variables } = useEnvironment();
  try {
    return originalValidateJWT('HS256', variables.JWT_SECRET, token);
  } catch {
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
    if (!decoded.subject) throw new NotAuthenticatedError('Your token is malformed.');
    const payload = TokenPayload.parse(decoded.payload);

    context.active().setValue(Symbol.for('ai.user.authUserId'), payload.id);
    return withUser({ ...payload, points: ctx.points, achievements: ctx.achievements }, next);
  } catch {
    throw new NotAuthenticatedError('Your token is malformed.');
  }
});

export const procedureWithPermissions = (required: keyof Permissions) => {
  return procedure.use(async ({ next }) => {
    const user = useUser();
    const permissions = await getPermissions(user.id);
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
