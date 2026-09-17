import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { verifyAuthToken } from '../modules/auth/auth.utils';
import { User } from '../modules/users/user.model';
import { UserRole } from '../constants/roles';

/**
 * Authentication middleware:
 * Checks for JWT in HTTP-only Cookie first, then falls back to Authorization: Bearer header.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      throw new AppError('Invalid or expired authentication session. Please log in again.', 401);
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AppError('User belonging to this session no longer exists.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware (RBAC).
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized access. User not authenticated.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }

    next();
  };
};
