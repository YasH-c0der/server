import { Otp } from './otp.model';
import { User, IUser } from '../users/user.model';
import { generateAuthToken, generateOtp, normalizePhone } from './auth.utils';
import { AppError } from '../../utils/appError';
import { SignupInput, LoginInput, UpdateProfileInput } from './auth.validation';
import { ACCOUNT_TYPES, AccountType } from '../../constants/accountTypes';

export interface RequestOtpResult {
  phone: string;
  otp: string;
  isRegistered: boolean;
  accountType?: AccountType;
  expiresInSeconds: number;
}

export interface AuthResponseResult {
  token: string;
  user: IUser;
}

export class AuthService {
  /**
   * Generates and stores OTP for login or registration.
   * Recognizes whether user is INDIVIDUAL or CORPORATE.
   */
  static async requestOtp(
    rawPhone: string,
    purpose?: 'LOGIN' | 'SIGNUP',
    requestedAccountType?: AccountType
  ): Promise<RequestOtpResult> {
    const phone = normalizePhone(rawPhone);
    const existingUser = await User.findOne({ phone });

    // Validation based on explicit flow purpose
    if (purpose === 'LOGIN' && !existingUser) {
      throw new AppError(
        'No account found with this phone number. Please sign up first.',
        404,
        { isRegistered: false, action: 'REDIRECT_TO_SIGNUP' }
      );
    }

    if (purpose === 'LOGIN' && existingUser && requestedAccountType && existingUser.accountType !== requestedAccountType) {
      throw new AppError(
        `This mobile number is registered as an ${existingUser.accountType} account, not ${requestedAccountType}.`,
        403
      );
    }

    if (purpose === 'SIGNUP' && existingUser) {
      throw new AppError(
        'An account with this phone number already exists. Please log in.',
        409
      );
    }

    const otp = generateOtp();

    // Remove any previously pending OTP for this number to avoid stale collision
    await Otp.deleteMany({ phone });

    // Store new OTP with 5-minute TTL
    await Otp.create({
      phone,
      otp,
      createdAt: new Date(),
    });

    return {
      phone,
      otp, // Provided in response for testing
      isRegistered: Boolean(existingUser),
      accountType: existingUser ? existingUser.accountType : requestedAccountType || ACCOUNT_TYPES.INDIVIDUAL,
      expiresInSeconds: 300,
    };
  }

  /**
   * Explicit Sign Up: Verifies OTP and registers user as INDIVIDUAL or CORPORATE.
   */
  static async signup(data: SignupInput): Promise<AuthResponseResult> {
    const phone = normalizePhone(data.phone);

    // 1. Guard against duplicate registration
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      throw new AppError(
        'Phone number is already registered. Please log in instead.',
        409
      );
    }

    // 2. Atomic OTP verification & consumption
    const validOtp = await Otp.findOneAndDelete({ phone, otp: data.otp });
    if (!validOtp) {
      throw new AppError('Invalid or expired OTP. Please request a new one.', 400);
    }

    // 3. Create the user with specified account type
    const user = await User.create({
      phone,
      name: data.name,
      email: data.email,
      accountType: data.accountType || ACCOUNT_TYPES.INDIVIDUAL,
      companyName: data.companyName,
      gstNumber: data.gstNumber,
    });

    // 4. Generate access token
    const token = generateAuthToken({
      userId: user._id.toString(),
      phone: user.phone,
      role: user.role,
      accountType: user.accountType,
    });

    return { token, user };
  }

  /**
   * Explicit Login: Verifies OTP for an existing registered user.
   */
  static async login(data: LoginInput): Promise<AuthResponseResult> {
    const phone = normalizePhone(data.phone);

    // 1. Verify user exists
    const user = await User.findOne({ phone });
    if (!user) {
      throw new AppError(
        'No account found with this mobile number. Please sign up.',
        404,
        { isRegistered: false, action: 'REDIRECT_TO_SIGNUP' }
      );
    }

    if (!user.isActive) {
      throw new AppError('Account has been deactivated. Please contact support.', 403);
    }

    // 2. Validate account type if specified
    if (data.accountType && user.accountType !== data.accountType) {
      throw new AppError(
        `This account is registered as ${user.accountType}. Please log in via the ${user.accountType.toLowerCase()} portal.`,
        403
      );
    }

    // 3. Atomic OTP verification & consumption
    const validOtp = await Otp.findOneAndDelete({ phone, otp: data.otp });
    if (!validOtp) {
      throw new AppError('Invalid or expired OTP. Please request a new one.', 400);
    }

    // 3. Generate access token
    const token = generateAuthToken({
      userId: user._id.toString(),
      phone: user.phone,
      role: user.role,
      accountType: user.accountType,
    });

    return { token, user };
  }

  /**
   * Fallback generic OTP verification (auto-login/register)
   */
  static async verifyOtp(
    rawPhone: string,
    otp: string,
    accountType?: AccountType
  ): Promise<AuthResponseResult & { isNewUser: boolean }> {
    const phone = normalizePhone(rawPhone);

    const validOtp = await Otp.findOneAndDelete({ phone, otp });
    if (!validOtp) {
      throw new AppError('Invalid or expired OTP. Please request a new one.', 400);
    }

    let isNewUser = false;
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        accountType: accountType || ACCOUNT_TYPES.INDIVIDUAL,
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
      accountType: user.accountType,
    });

    return { token, user, isNewUser };
  }

  /**
   * Updates user profile (name, email, accountType, companyName, gstNumber).
   */
  static async updateProfile(userId: string, data: UpdateProfileInput): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    if (data.accountType !== undefined) user.accountType = data.accountType;
    if (data.companyName !== undefined) user.companyName = data.companyName;
    if (data.gstNumber !== undefined) user.gstNumber = data.gstNumber;

    await user.save();
    return user;
  }
}
