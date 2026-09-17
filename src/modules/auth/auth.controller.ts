import { Request, Response, NextFunction, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';
import { env } from '../../config/env';
import {
  RequestOtpInput,
  SignupInput,
  LoginInput,
  VerifyOtpInput,
  UpdateProfileInput,
} from './auth.validation';

/**
 * Production Cookie Options:
 * - httpOnly: true (prevents client-side JS/XSS attacks from reading the token)
 * - secure: true in production (forces HTTPS transmission)
 * - sameSite: 'lax' in development, 'none' with secure in production for cross-origin APIs
 * - maxAge: 7 days
 */
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  /**
   * POST /api/auth/request-otp
   * Request OTP for mobile authentication (returns OTP in payload for dev/testing)
   */
  static async requestOtp(
    req: Request<unknown, unknown, RequestOtpInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.requestOtp(
        req.body.phone,
        req.body.purpose,
        req.body.accountType
      );
      ApiResponse.success(
        res,
        result,
        result.isRegistered
          ? 'OTP sent successfully for login.'
          : 'OTP sent successfully for new account registration.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/signup
   * Register a new user and attach HTTP-only session cookie
   */
  static async signup(
    req: Request<unknown, unknown, SignupInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.signup(req.body);
      
      // Store token securely in HTTP-only cookie
      res.cookie('token', result.token, COOKIE_OPTIONS);

      ApiResponse.created(
        res,
        result,
        'Account created successfully. Welcome to drinkPure!'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login an existing user and attach HTTP-only session cookie
   */
  static async login(
    req: Request<unknown, unknown, LoginInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.login(req.body);

      // Store token securely in HTTP-only cookie
      res.cookie('token', result.token, COOKIE_OPTIONS);

      ApiResponse.success(res, result, 'Login successful.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-otp (Generic fallback)
   * Verify 6-digit OTP and attach HTTP-only session cookie
   */
  static async verifyOtp(
    req: Request<unknown, unknown, VerifyOtpInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.verifyOtp(
        req.body.phone,
        req.body.otp,
        req.body.accountType
      );

      // Store token securely in HTTP-only cookie
      res.cookie('token', result.token, COOKIE_OPTIONS);

      ApiResponse.success(
        res,
        result,
        result.isNewUser
          ? 'Registration successful. Welcome to drinkPure!'
          : 'Login successful.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Clears the HTTP-only auth cookie
   */
  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    ApiResponse.success(res, null, 'Logged out successfully.');
  }

  /**
   * GET /api/auth/me
   * Get authenticated user profile from session cookie / token
   */
  static async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      ApiResponse.success(res, req.user, 'User profile fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/auth/profile
   * Update name and email of authenticated user
   */
  static async updateProfile(
    req: Request<unknown, unknown, UpdateProfileInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const updatedUser = await AuthService.updateProfile(
        req.user!._id.toString(),
        req.body
      );
      ApiResponse.success(res, updatedUser, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
