// src/api/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { userService } from '../../core/services/user.service';
import { AppError } from '../../utils/errors/app-error';
import logger from '../../utils/logging/logger';

// Extend the Express Request type to include a user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from headers or cookies
    let token: string | undefined;
    
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If no token in Authorization header, check cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // If no token found, return unauthorized
    if (!token) {
      return next(AppError.unauthorized('Authentication required'));
    }
    
    // Verify token
    const userId = userService.verifyToken(token);
    
    if (!userId) {
      return next(AppError.unauthorized('Invalid or expired token'));
    }
    
    // Get user from database
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return next(AppError.unauthorized('User not found'));
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    next(AppError.unauthorized('Authentication failed'));
  }
}

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required role
 */
export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to access this resource'));
    }
    
    next();
  };
}