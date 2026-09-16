import { Otp } from './otp.model';
import { User, IUser } from '../users/user.model';
import { generateAuthToken, generateOtp, normalizePhone } from './auth.utils';
import { AppError } from '../../utils/appError';
import { UpdateProfileInput } from './auth.validation';

export interface RequestOtpResult {
  phone: string;
  otp: string;
  isRegistered: boolean;
  expiresInSeconds: number;
}

export interface VerifyOtpResult {
  token: string;
  user: IUser;
  isNewUser: boolean;
}

export class AuthService {
  /**
   * Generates and stores OTP for login or registration.
   * As per requirements, returns the generated OTP in response for development/testing.
   */
  static async requestOtp(rawPhone: string): Promise<RequestOtpResult> {
    const phone = normalizePhone(rawPhone);
    const otp = generateOtp();

    // Remove any previously pending OTP for this number to avoid stale collision
    await Otp.deleteMany({ phone });

    // Store new OTP with 5-minute TTL
    await Otp.create({
      phone,
      otp,
      createdAt: new Date(),
    });

    const existingUser = await User.findOne({ phone });

    return {
      phone,
      otp, // Provided in response as requested for testing
      isRegistered: Boolean(existingUser),
      expiresInSeconds: 300,
    };
  }

  /**
   * Verifies OTP, clears it atomically, and logs in or creates a new user.
   */
  static async verifyOtp(rawPhone: string, otp: string): Promise<VerifyOtpResult> {
    const phone = normalizePhone(rawPhone);

    // Atomic find & delete prevents replay attacks (OTP can only be used once)
    const validOtp = await Otp.findOneAndDelete({ phone, otp });

    if (!validOtp) {
      throw new AppError('Invalid or expired OTP. Please request a new one.', 400);
    }

    let isNewUser = false;
    let user = await User.findOne({ phone });

    if (!user) {
      // Auto-register customer upon first successful phone verification
      user = await User.create({
        phone,
      });
      isNewUser = true;
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Please contact support.', 403);
    }

    const token = generateAuthToken({
      userId: user._id.toString(),
      phone: user.phone,
      role: user.role,
    });

    return {
      token,
      user,
      isNewUser,
    };
  }

  /**
   * Updates user profile (name, email).
   */
  static async updateProfile(userId: string, data: UpdateProfileInput): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;

    await user.save();
    return user;
  }
}
