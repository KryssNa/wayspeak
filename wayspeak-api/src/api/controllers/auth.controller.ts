import { Request, Response, NextFunction } from 'express';
import { userService } from '../../core/services/user.service';
import { AppError } from '../../utils/errors/app-error';
import config from '../../config';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, companyName } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return next(AppError.badRequest('Name, email, and password are required'));
      }

      // Register user
      const { user, token } = await userService.register({
        name,
        email,
        password,
        companyName,
      });

      // Set cookie with token
      this.setCookieWithToken(res, token);

      // Return user and token
      res.status(201).json({
        status: 'success',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return next(AppError.badRequest('Email and password are required'));
      }

      // Login user
      const { user, token } = await userService.login({
        email,
        password,
      });

      // Set cookie with token
      this.setCookieWithToken(res, token);

      // Return user and token
      res.status(200).json({
        status: 'success',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Clear cookie
      res.clearCookie('token');

      res.status(200).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // Return user from request (set by authenticate middleware)
      res.status(200).json({
        status: 'success',
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id;
      const { name, email, companyName } = req.body;

      // Update user
      const updated = await userService.updateUser(userId, {
        name,
        email,
        companyName,
      });

      if (!updated) {
        return next(AppError.internal('Failed to update profile'));
      }

      // Get updated user
      const user = await userService.getUserById(userId);

      res.status(200).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id;
      const { currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return next(AppError.badRequest('Current password and new password are required'));
      }

      // Change password
      const updated = await userService.changePassword(userId, currentPassword, newPassword);

      if (!updated) {
        return next(AppError.internal('Failed to change password'));
      }

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return next(AppError.badRequest('Refresh token is required'));
      }

      // Verify refresh token
      const userId = userService.verifyToken(refreshToken);
      if (!userId) {
        return next(AppError.unauthorized('Invalid or expired refresh token'));
      }

      // Generate new token
      const newToken = userService.generateToken(userId);

      // Set cookie with new token
      this.setCookieWithToken(res, newToken);

      res.status(200).json({
        status: 'success',
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private setCookieWithToken(res: Response, token: string) {
    // Set cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.server.env === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict',
    });
  }
}

export const authController = new AuthController();
