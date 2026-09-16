import { z } from 'zod';

export const requestOtpSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .trim()
    .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Please provide a valid 10-digit mobile number'),
});

export const verifyOtpSchema = z.object({
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
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters').optional(),
  email: z.string().email('Please enter a valid email address').optional(),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
