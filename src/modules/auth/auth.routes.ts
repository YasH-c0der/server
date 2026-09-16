import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  requestOtpSchema,
  verifyOtpSchema,
  updateProfileSchema,
} from './auth.validation';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Public Authentication Endpoints
router.post(
  '/request-otp',
  validateRequest({ body: requestOtpSchema }),
  AuthController.requestOtp
);

router.post(
  '/verify-otp',
  validateRequest({ body: verifyOtpSchema }),
  AuthController.verifyOtp
);

// Authenticated User Endpoints
router.get('/me', authenticate, AuthController.getMe);

router.patch(
  '/profile',
  authenticate,
  validateRequest({ body: updateProfileSchema }),
  AuthController.updateProfile
);

export default router;
