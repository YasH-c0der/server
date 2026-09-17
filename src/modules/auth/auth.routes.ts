import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  requestOtpSchema,
  signupSchema,
  loginSchema,
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
  '/signup',
  validateRequest({ body: signupSchema }),
  AuthController.signup
);

router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  AuthController.login
);

router.post(
  '/verify-otp',
  validateRequest({ body: verifyOtpSchema }),
  AuthController.verifyOtp
);

// Authenticated User Endpoints
router.get('/me', authenticate, AuthController.getMe);
router.post('/logout', authenticate, AuthController.logout);

router.patch(
  '/profile',
  authenticate,
  validateRequest({ body: updateProfileSchema }),
  AuthController.updateProfile
);

export default router;
