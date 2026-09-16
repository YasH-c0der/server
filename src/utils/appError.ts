/**
 * Custom application error class for operational (predictable) errors.
 * Distinguishes between predictable business logic errors and unhandled programming crashes.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Record<string, unknown> | Array<unknown>;

  constructor(
    message: string,
    statusCode = 500,
    errors?: Record<string, unknown> | Array<unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
