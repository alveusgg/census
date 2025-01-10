import { useAppInsights } from '@/services/insights/hooks';
import { cn } from '@/utils/cn';
import { CustomError } from '@alveusgg/error';
import { TRPCClientError } from '@trpc/client';
import ErrorStackParser from 'error-stack-parser';
import { ComponentProps, FC, PropsWithChildren, useEffect, useState } from 'react';
import { ErrorBoundary as CoreErrorBoundary, FallbackProps } from 'react-error-boundary';
import { isRouteErrorResponse } from 'react-router';
import { Link, useLocation, useRevalidator, useRouteError } from 'react-router-dom';
import { ZodError, ZodIssue } from 'zod';
import { build } from '~build/meta';
import now from '~build/time';
import { Button } from '../controls/button/juicy';
import SiCheck from '../icons/SiCheck';
import SiCopy from '../icons/SiCopy';
import { NotFoundPage } from './NotFoundError';

interface ErrorProps {
  error: Error;
}

const Explanation: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex w-full bg-accent-50 border border-accent-200 flex-col gap-1.5 rounded-lg p-5 text-left leading-5">
    {children}
  </div>
);

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

export const SessionReference: FC = () => {
  const { getSessionId } = useAppInsights(state => state);
  const [clipboardStatus, setClipboardStatus] = useState<'idle' | 'copied'>('idle');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setClipboardStatus('copied');
    setTimeout(() => setClipboardStatus('idle'), 2000);
  };

  const sessionId = getSessionId();
  if (!sessionId) {
    return null;
  }

  const buildId = build ?? 'Unknown';
  const builtAt = now ?? new Date();

  const reference = `${sessionId} • ${buildId} • ${builtAt.toISOString()}`;

  return (
    <button
      onClick={() => copyToClipboard(reference)}
      className="bg-accent-50 text-accent-800 relative flex items-center gap-2 overflow-clip rounded-md px-3 py-2 text-sm shadow-sm"
    >
      <span>{reference}</span>
      <SiCopy />
      {clipboardStatus === 'copied' && (
        <span className="bg-accent-100 text-accent-800 absolute inset-0 flex items-center justify-center gap-1 text-sm font-medium">
          <SiCheck />
          <span>Copied!</span>
        </span>
      )}
    </button>
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

export const CriticalErrorBoundary: FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const trackException = useAppInsights(state => state.trackException);
  const location = useLocation();

  useEffect(() => {
    if (error && error instanceof Error) {
      trackException(error);
    }
  }, [error]);

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
        <div className="flex flex-col gap-3">
          <p className="leading-5 text-balance">
            If this is your first time having problems please try again to see if the problem is resolved.
          </p>
          <Link onClick={() => resetErrorBoundary()} to="/auth/signout">
            <Button className="mx-auto">Sign out & try again</Button>
          </Link>
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="leading-5 text-balance">
            If you continue to encounter a problem please contact support with the session reference below.
          </p>
          <SessionReference />
        </div>
      </div>
    </div>
  );
};

export const RouteErrorBoundary: FC<PropsWithChildren> = () => {
  const error = useRouteError();
  const validator = useRevalidator();

  if (isRouteErrorResponse(error)) {
    return <NotFoundPage>that page does not exist</NotFoundPage>;
  }

  return <CriticalErrorBoundary error={error as Error} resetErrorBoundary={() => validator.revalidate()} />;
};

export const ComponentErrorBoundary: FC<PropsWithChildren> = ({ children }) => {
  const trackException = useAppInsights(state => state.trackException);
  return (
    <CoreErrorBoundary
      onError={error => {
        trackException(error);
      }}
      FallbackComponent={CriticalErrorBoundary}
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
