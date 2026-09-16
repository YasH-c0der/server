import { Response } from 'express';

export interface ApiResponseOptions<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export class ApiResponse {
  static send<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T
  ): Response {
    return res.status(statusCode).json({
      success: statusCode >= 200 && statusCode < 300,
      message,
      data: data ?? null,
      timestamp: new Date().toISOString(),
    });
  }

  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200
  ): Response {
    return this.send(res, statusCode, message, data);
  }

  static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully'
  ): Response {
    return this.send(res, 201, message, data);
  }
}
