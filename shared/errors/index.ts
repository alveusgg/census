interface SerializedCustomError {
  name: string;
  code: number;
  message: string;
  stack?: string;
}

export class CustomError extends Error {
  public name: string = 'CustomError';
  public code: number = 500;
  public message: string;
  public stack?: string;

  static from(payload: SerializedCustomError | string) {
    let error: SerializedCustomError;
    if (typeof payload === 'string') {
      error = JSON.parse(payload);
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
      default:
        return new CustomError(error.message);
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
}

export class NotAuthenticatedError extends CustomError {
  public name: string = 'NotAuthenticatedError';
  public code: number = 401;
}

export class ForbiddenError extends CustomError {
  public name: string = 'ForbiddenError';
  public code: number = 403;
}
