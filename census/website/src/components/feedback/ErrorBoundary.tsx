import { cn } from '@/utils/cn';
import { CustomError } from '@alveusgg/error';
import * as Sentry from '@sentry/react';
import { TRPCClientError } from '@trpc/client';
import ErrorStackParser from 'error-stack-parser';
import { ComponentProps, ErrorInfo, FC, PropsWithChildren, useEffect, useState } from 'react';
import { ErrorBoundary as CoreErrorBoundary, FallbackProps } from 'react-error-boundary';
import { isRouteErrorResponse } from 'react-router';
import { Link, useLocation, useRevalidator, useRouteError } from 'react-router-dom';
import { ZodError, ZodIssue } from 'zod';
import { Button } from '../controls/button/juicy';
import { NotFoundPage } from './NotFoundError';

type BoundaryKind = 'component' | 'route';

interface SentryReference {
  eventId: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
}

interface ErrorProps {
  error: Error;
}

const Explanation: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex w-full bg-accent-50 border border-accent-200 flex-col gap-1.5 rounded-lg p-5 text-left leading-5">
    {children}
  </div>
);

const getActiveSentryReference = (eventId: string): SentryReference => {
  const span = Sentry.getActiveSpan()?.spanContext();
  const user = Sentry.getCurrentScope().getUser();
  return {
    eventId,
    traceId: span?.traceId,
    spanId: span?.spanId,
    userId: user?.id === undefined ? undefined : String(user.id)
  };
};

const captureBoundaryError = (error: unknown, boundary: BoundaryKind, context: Record<string, unknown> = {}) => {
  const eventId = Sentry.withScope(scope => {
    scope.setTag('error_boundary', boundary);
    scope.setContext('error_boundary', { boundary, ...context });
    return Sentry.captureException(error);
  });

  return getActiveSentryReference(eventId);
};

const captureComponentBoundaryError = (error: Error, errorInfo: ErrorInfo) => {
  const eventId = Sentry.withScope(scope => {
    scope.setTag('error_boundary', 'component');
    scope.setContext('error_boundary', { boundary: 'component' });
    return Sentry.captureReactException(error, errorInfo);
  });

  return getActiveSentryReference(eventId);
};

const SupportReference: FC<{ sentry?: SentryReference }> = ({ sentry }) => {
  if (!sentry) return null;

  const references: [string, string | undefined][] = [
    ['Event ID', sentry.eventId],
    ['Trace ID', sentry.traceId],
    ['Span ID', sentry.spanId],
    ['User ID', sentry.userId]
  ].filter((reference): reference is [string, string] => Boolean(reference[1]));

  if (!references.length) return null;

  return (
    <Explanation>
      <h2 className="font-medium">Support reference</h2>
      <dl className="flex flex-col gap-1">
        {references.map(([label, value]) => (
          <div className="min-w-0 text-sm" key={label}>
            <dt className="font-medium">{label}:</dt>
            <dd>
              <code className="break-all text-secondary-std text-xs font-medium">{value}</code>
            </dd>
          </div>
        ))}
      </dl>
    </Explanation>
  );
};

export const ErrorExplanation: FC<ErrorProps> = ({ error }) => {
  const [currentDate] = useState(new Date());
  return (
    <Explanation>
      <h2 className="font-medium">Error</h2>
      <p className="text-sm">
        This error is in a raw format which means it is not handled by the application. Please contact support when
        possible about this problem.
      </p>
      <p>
        <label className="mr-1 text-sm font-medium">Message:</label>
        <code>{error.message}</code>
      </p>
      <code className="text-secondary-std text-xs font-medium">{currentDate.toISOString()}</code>
    </Explanation>
  );
};

interface CustomErrorProps {
  error: CustomError;
}

export const CustomErrorExplanation: FC<CustomErrorProps> = ({ error }) => {
  const [currentDate] = useState(new Date());
  return (
    <Explanation>
      <h2 className="font-medium">{error.name}</h2>
      <p>
        <label className="mr-1 text-sm font-medium">Message:</label>
        {error.message}
      </p>
      <code className="text-secondary-std text-xs font-medium">{currentDate.toISOString()}</code>
    </Explanation>
  );
};

const ServerErrorExplanation: FC = () => {
  return (
    <Explanation>
      <h2 className="font-medium">Server Error</h2>
      <p>I'm sorry, we can't connect to the server. Please try again or contact support for help.</p>
    </Explanation>
  );
};

interface ValidationErrorProps {
  error: ZodError;
}

const Issue: FC<ZodIssue> = ({ path, message }) => {
  return (
    <div>
      <p className="text-sm">
        <label className="mr-1 font-medium">Issue:</label>
        Property &quot;{path.join('.')}&quot;{message === 'Required' ? ' is required' : `: ${message}`}
      </p>
    </div>
  );
};

const getAppropriateStackFrame = (stack: ErrorStackParser.StackFrame[]) => {
  const index = stack.findIndex(frame => frame.functionName?.includes('.parse'));
  if (index === -1) return;
  return stack[index + 1];
};

const formatFunctionName = (name: string) => {
  const firstLetter = name.charAt(0);
  if (firstLetter === firstLetter.toUpperCase()) return `<${name} />`;
  return `${name}()`;
};

export const ValidationErrorExplanation: FC<ValidationErrorProps> = ({ error }) => {
  const [currentDate] = useState(new Date());
  const stack = ErrorStackParser.parse(error);
  const frame = getAppropriateStackFrame(stack);
  return (
    <Explanation>
      <h2 className="font-medium">
        Validation error{' '}
        {frame?.functionName && (
          <>
            at <code>{formatFunctionName(frame.functionName)}</code>
          </>
        )}
      </h2>
      <div>{error.issues.map(Issue)}</div>
      <code className="text-secondary-std text-xs font-medium">{currentDate.toISOString()}</code>
    </Explanation>
  );
};

const getExplanationForError = (error: unknown) => {
  if (error instanceof TRPCClientError) {
    const custom = CustomError.from(error.message);
    if (custom) return <CustomErrorExplanation error={custom} />;
    return <ServerErrorExplanation />;
  }
  if (error instanceof ZodError) {
    return <ValidationErrorExplanation error={error} />;
  }
  if (error instanceof Error) {
    return <ErrorExplanation error={error} />;
  }
  return null;
};

interface CriticalErrorBoundaryProps extends FallbackProps {
  sentry?: SentryReference;
}

export const CriticalErrorBoundary: FC<CriticalErrorBoundaryProps> = ({ error, resetErrorBoundary, sentry }) => {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className="bg-accent-200 text-accent-950 flex h-screen w-screen justify-center p-6 md:items-center"
    >
      <div className="flex bg-accent-100 border border-accent-300 py-20 px-12 rounded-3xl w-full max-w-lg flex-col items-center gap-8 text-center md:justify-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold leading-6 text-balance">A problem has occurred</h1>
          <p className="leading-5 text-balance">
            {`We're sorry, we've encountered a problem that has stopped the application working as expected.`}
          </p>
        </div>
        {getExplanationForError(error)}
        <SupportReference sentry={sentry} />
        <div className="flex flex-col gap-3">
          <p className="leading-5 text-balance">
            If this is your first time having problems please try again to see if the problem is resolved.
          </p>
          <Link onClick={() => resetErrorBoundary()} to="/auth/signout">
            <Button className="mx-auto">Sign out & try again</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export const RouteErrorBoundary: FC<PropsWithChildren> = () => {
  const error = useRouteError();
  const validator = useRevalidator();
  const location = useLocation();
  const locationKey = `${location.pathname}${location.search}${location.hash}`;
  const [sentryReference, setSentryReference] = useState<SentryReference>();

  useEffect(() => {
    if (isRouteErrorResponse(error) && error.status < 500) {
      setSentryReference(undefined);
      return;
    }

    setSentryReference(
      captureBoundaryError(error, 'route', {
        location: locationKey,
        ...(isRouteErrorResponse(error)
          ? {
              status: error.status,
              statusText: error.statusText,
              data: error.data
            }
          : {})
      })
    );
  }, [error, locationKey]);

  if (isRouteErrorResponse(error)) {
    return <NotFoundPage>that page does not exist</NotFoundPage>;
  }

  return (
    <CriticalErrorBoundary
      error={error as Error}
      resetErrorBoundary={() => validator.revalidate()}
      sentry={sentryReference}
    />
  );
};

export const ComponentErrorBoundary: FC<PropsWithChildren> = ({ children }) => {
  const [sentryReference, setSentryReference] = useState<SentryReference>();

  return (
    <CoreErrorBoundary
      fallbackRender={props => <CriticalErrorBoundary {...props} sentry={sentryReference} />}
      onError={(error, errorInfo) => setSentryReference(captureComponentBoundaryError(error, errorInfo))}
      onReset={() => setSentryReference(undefined)}
    >
      {children}
    </CoreErrorBoundary>
  );
};

export const ErrorBoundary: FC<PropsWithChildren<ComponentProps<'div'> & { for: number }>> = ({
  children,
  className,
  ...props
}) => {
  const error = useRouteError();
  if (!(error instanceof TRPCClientError)) {
    throw error;
  }

  if (!(error instanceof TRPCClientError)) throw error;
  const custom = CustomError.from(error.message);
  if (!custom || custom.code !== props.for) {
    throw error;
  }

  return (
    <div className={cn('flex w-full flex-1 justify-center p-6 md:items-center', className)} {...props}>
      {children}
    </div>
  );
};

export const handleTRPCError = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  const custom = CustomError.from(error.message);
  return custom;
};
