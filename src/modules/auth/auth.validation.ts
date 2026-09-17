import { z } from 'zod';
import { ACCOUNT_TYPES } from '../../constants/accountTypes';

export const requestOtpSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .trim()
    .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Please provide a valid 10-digit mobile number'),
  purpose: z.enum(['LOGIN', 'SIGNUP']).optional(),
  accountType: z.enum([ACCOUNT_TYPES.INDIVIDUAL, ACCOUNT_TYPES.CORPORATE]).optional(),
});

/**
 * Minimal friction quick-commerce signup:
 * Only phone, OTP, and accountType are needed.
 * Name, email, companyName, and gstNumber are optional and can be filled later in profile.
 */
export const signupSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .trim()
    .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Please provide a valid 10-digit mobile number'),
  otp: z
    .string()
    .min(1, 'OTP is required')
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain numbers only'),
  accountType: z
    .enum([ACCOUNT_TYPES.INDIVIDUAL, ACCOUNT_TYPES.CORPORATE])
    .default(ACCOUNT_TYPES.INDIVIDUAL),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  companyName: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name cannot exceed 100 characters')
    .optional(),
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Please enter a valid 15-character GST number (e.g. 29ABCDE1234F1Z5)'
    )
    .optional(),
});

export const loginSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .trim()
    .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Please provide a valid 10-digit mobile number'),
  otp: z
    .string()
    .min(1, 'OTP is required')
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain numbers only'),
  accountType: z.enum([ACCOUNT_TYPES.INDIVIDUAL, ACCOUNT_TYPES.CORPORATE]).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters').optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  accountType: z.enum([ACCOUNT_TYPES.INDIVIDUAL, ACCOUNT_TYPES.CORPORATE]).optional(),
  companyName: z.string().trim().max(100).optional(),
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Please enter a valid 15-character GST number'
    )
    .optional(),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const verifyOtpSchema = loginSchema;
export type VerifyOtpInput = LoginInput;
