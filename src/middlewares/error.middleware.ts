import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/appError';
import { env } from '../config/env';

/**
 * CRASH RISK MITIGATION:
 * Risk: Unhandled exceptions or uncaught middleware rejections terminate the Node process.
 * Additionally, leaking stack traces or raw database query errors exposes internal vulnerability surface.
 * Mitigation: Centralized error handling catches all synchronous and asynchronous errors,
 * formats them into standardized RFC-compliant JSON responses, masks sensitive internal errors in production,
 * and maintains continuous server uptime.
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = null;

  // 1. Known Operational AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.errors ?? null;
  }
  // 2. Zod Schema Validation Error
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
  // 3. Mongoose Cast Error (Invalid MongoDB ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid format for resource identifier: ${err.path}`;
  }
  // 4. Mongoose Duplicate Key Error (Unique index violation)
  else if ('code' in err && (err as { code: number }).code === 11000) {
    statusCode = 409;
    message = 'Resource already exists with unique field constraint.';
  }
  // 5. Malformed JSON payload from body-parser
  else if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON payload provided in request body.';
  }
  // 6. Generic/Unknown Error
  else {
    console.error('💥 Unhandled Unexpected Error:', err);
    if (env.NODE_ENV === 'development') {
      message = err.message;
      details = err.stack;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
    timestamp: new Date().toISOString(),
  });
};
