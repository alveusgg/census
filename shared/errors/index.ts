import { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';

interface SerializedCustomError {
  name: string;
  code: number;
  message: string;
  stack?: string;
}

export class CustomError extends Error {
  public name: string = 'CustomError';
  public category: TRPC_ERROR_CODE_KEY = 'INTERNAL_SERVER_ERROR';
  public code: number = 500;
  public message: string;
  public stack?: string;

  static from(payload: SerializedCustomError | string) {
    let error: SerializedCustomError;
    if (typeof payload === 'string') {
      try {
        error = JSON.parse(payload);
      } catch {
        return;
      }
    } else {
      error = payload;
    }

    switch (error.name) {
      case 'NotFoundError':
        return new NotFoundError(error.message);
      case 'NotAuthenticatedError':
        return new NotAuthenticatedError(error.message);
      case 'ForbiddenError':
        return new ForbiddenError(error.message);
      case 'DownstreamError':
        const [service, message] = error.message.split(':');
        return new DownstreamError(service, message.trim());
      case 'BadRequestError':
        return new BadRequestError(error.message);
      case 'AuthenticationTimeoutError':
        return new AuthenticationTimeoutError(error.message);
      case 'ProcessingError':
        return new ProcessingError(error.message);
    }
  }

  constructor(message: string) {
    super(message);
    this.message = message;
    this.stack = Error().stack;
  }

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message
    };
  }
}

export class NotFoundError extends CustomError {
  public name: string = 'NotFoundError';
  public code: number = 404;
  public category: TRPC_ERROR_CODE_KEY = 'NOT_FOUND';
}

export class NotAuthenticatedError extends CustomError {
  public name: string = 'NotAuthenticatedError';
  public code: number = 401;
  public category: TRPC_ERROR_CODE_KEY = 'UNAUTHORIZED';
}

export class AuthenticationTimeoutError extends CustomError {
  public name: string = 'AuthenticationTimeoutError';
  public code: number = 401;
  public category: TRPC_ERROR_CODE_KEY = 'UNAUTHORIZED';
}

export class ForbiddenError extends CustomError {
  public name: string = 'ForbiddenError';
  public code: number = 403;
  public category: TRPC_ERROR_CODE_KEY = 'FORBIDDEN';
}

export class ProcessingError extends CustomError {
  public name: string = 'ProcessingError';
  public code: number = 500;
  public category: TRPC_ERROR_CODE_KEY = 'INTERNAL_SERVER_ERROR';
}

export class DownstreamError extends CustomError {
  public name: string = 'DownstreamError';
  public code: number = 500;
  public service: string;
  public category: TRPC_ERROR_CODE_KEY = 'INTERNAL_SERVER_ERROR';
  constructor(service: string, message: string) {
    super(`${service}: ${message}`);
    this.service = service;
  }
}

export class BadRequestError extends CustomError {
  public name: string = 'BadRequestError';
  public code: number = 400;
  public category: TRPC_ERROR_CODE_KEY = 'BAD_REQUEST';
}
