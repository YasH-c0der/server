import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import { AppError } from './utils/appError';
import { ApiResponse } from './utils/apiResponse';

import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import addressRoutes from './modules/addresses/address.routes';

const app: Application = express();

// Trust the first reverse proxy hop (Render, Cloudflare, AWS ALB) for accurate IP rate-limiting
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS Configuration (Reflects origin or configured origins to allow credentials with cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (env.CORS_ORIGIN === '*' || env.CORS_ORIGIN.split(',').includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);

// Cookie Parser for HTTP-only Auth Cookies
app.use(cookieParser());

// Global Rate Limiting: 200 requests per 15 mins per IP for standard API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', limiter);

// Request Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return ApiResponse.success(
    res,
    {
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatusMap[dbState] ?? 'unknown',
      environment: env.NODE_ENV,
    },
    'drinkPure backend service is healthy'
  );
});

// Domain Routes
app.use('/api/auth', authRoutes);
app.use('/api/addresses', addressRoutes);

// 404 Fallback for Unmatched Routes
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;