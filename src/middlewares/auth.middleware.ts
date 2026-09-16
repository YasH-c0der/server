import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { verifyAuthToken } from '../modules/auth/auth.utils';
import { User } from '../modules/users/user.model';
import { UserRole } from '../constants/roles';

/**
 * Authentication middleware that verifies JWT and loads the authenticated user.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a Bearer token.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Token is missing in authorization header.', 401);
    }

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      throw new AppError('Invalid or expired authentication token.', 401);
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401);
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
