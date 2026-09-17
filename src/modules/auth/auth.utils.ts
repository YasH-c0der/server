import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { UserRole } from '../../constants/roles';

import { AccountType } from '../../constants/accountTypes';

export interface JwtUserPayload {
  userId: string;
  phone: string;
  role: UserRole;
  accountType?: AccountType;
}

export const generateAuthToken = (payload: JwtUserPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyAuthToken = (token: string): JwtUserPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
};

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 */
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Normalizes phone numbers (removes spaces, hyphens, and standardizes format).
 */
export const normalizePhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // If 10 digits without country code, keep as 10 digits
  if (/^\d{10}$/.test(cleaned)) {
    return cleaned;
  }
  // If starts with +91 or 91 with 10 following digits
  if (/^(\+91|91)\d{10}$/.test(cleaned)) {
    return cleaned.slice(-10);
  }
  return cleaned;
};
