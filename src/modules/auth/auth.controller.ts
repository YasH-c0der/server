import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';
import { RequestOtpInput, VerifyOtpInput, UpdateProfileInput } from './auth.validation';

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
      const result = await AuthService.requestOtp(req.body.phone);
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
   * POST /api/auth/verify-otp
   * Verify 6-digit OTP and issue JWT access token
   */
  static async verifyOtp(
    req: Request<unknown, unknown, VerifyOtpInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.verifyOtp(req.body.phone, req.body.otp);
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
   * GET /api/auth/me
   * Get authenticated user profile
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
