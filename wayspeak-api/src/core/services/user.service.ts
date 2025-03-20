// src/core/services/user.service.ts
import jwt from 'jsonwebtoken';
import config from '../../config';
import { AppError } from '../../utils/errors/app-error';
import logger from '../../utils/logging/logger';
import { IUser, IUserResponse, UserModel, UserRole, UserStatus } from '../models/user.model';

interface RegisterParams {
  name: string;
  email: string;
  password: string;
  companyName?: string;
}

interface LoginParams {
  email: string;
  password: string;
}

interface AuthResult {
  user: IUserResponse;
  token: string;
  refreshToken?: string;
}

class UserService {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  /**
   * Register a new user
   */
  async register(params: RegisterParams): Promise<AuthResult> {
    try {
      // Check if email already exists
      const existingUser = await this.userModel.getByEmail(params.email);

      if (existingUser) {
        throw AppError.badRequest('Email already in use');
      }

      // Create new user
      const user = await this.userModel.create({
        name: params.name,
        email: params.email.toLowerCase(),
        password: params.password,
        companyName: params.companyName,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      // Generate token
      const token = this.generateToken(user._id!.toString());
      const refreshToken = this.generateRefreshToken(user._id!.toString());

      return {
        user: this.userModel.toResponse(user),
        token,
        refreshToken,
      };
    } catch (error) {
      logger.error('Error registering user', { error, email: params.email });
      throw error;
    }
  }

  /**
   * Login a user
   */
  async login(params: LoginParams): Promise<AuthResult> {
    try {
      // Get user by email
      const user = await this.userModel.getByEmail(params.email);

      // Check if user exists
      if (!user) {
        throw AppError.unauthorized('Invalid email or password');
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw AppError.unauthorized('Your account is not active');
      }

      // Verify password
      if (!user.password) {
        throw AppError.unauthorized('Invalid login method');
      }

      const isPasswordValid = await this.userModel.comparePassword(
        params.password,
        user.password
      );

      if (!isPasswordValid) {
        throw AppError.unauthorized('Invalid email or password');
      }

      // Update last login time
      await this.userModel.updateLastLogin(user._id!.toString());

      // Generate tokens
      const token = this.generateToken(user._id!.toString());
      const refreshToken = this.generateRefreshToken(user._id!.toString());

      return {
        user: this.userModel.toResponse(user),
        token,
        refreshToken,
      };
    } catch (error) {
      logger.error('Error logging in user', { error, email: params.email });
      throw error;
    }
  }
  

  /**
 * Login with WhatsApp
 * Finds or creates user with WhatsApp number
 */
async loginWithWhatsApp(whatsappNumber: string): Promise<AuthResult> {
  try {
    // Normalize phone number
    const normalizedNumber = this.normalizePhoneNumber(whatsappNumber);
    
    // Find user by WhatsApp number
    let user = await this.userModel.getByWhatsAppNumber(normalizedNumber);
    
    // If user doesn't exist, create a new one
    if (!user) {
      // Generate a random name and email for the new user
      const randomId = Math.floor(Math.random() * 10000);
      const name = `WhatsApp User ${randomId}`;
      const email = `whatsapp_${randomId}@placeholder.com`;
      
      user = await this.userModel.create({
        name,
        email,
        whatsappPhoneNumber: normalizedNumber,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
    }
    
    // Update last login time
    await this.userModel.updateLastLogin(user._id!.toString());
    
    // Generate token
    const token = this.generateToken(user._id!.toString());
    const refreshToken = this.generateRefreshToken(user._id!.toString());
    
    return {
      user: this.userModel.toResponse(user),
      token,
      refreshToken,
    };
  } catch (error) {
    logger.error('Error logging in with WhatsApp', { error, whatsappNumber });
    throw error;
  }
}

/**
 * Normalize phone number to standard format
 */
private normalizePhoneNumber(phoneNumber: string): string {
  // Remove any non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Make sure it has international format
  if (!cleaned.startsWith('1')) {
    cleaned = '1' + cleaned; // Assuming US/Canada
  }
  
  return '+' + cleaned;
}
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<IUserResponse | null> {
    try {
      const user = await this.userModel.getById(id);

      if (!user) return null;

      return this.userModel.toResponse(user);
    } catch (error) {
      logger.error('Error getting user by ID', { error, id });
      throw error;
    }
  }

  /**
   * Update a user
   */
  async updateUser(id: string, updates: Partial<IUser>): Promise<boolean> {
    try {
      // If email is being updated, check for duplicates
      if (updates.email) {
        const existingUser = await this.userModel.getByEmail(updates.email);

        if (existingUser && existingUser._id!.toString() !== id) {
          throw AppError.badRequest('Email already in use');
        }

        updates.email = updates.email.toLowerCase();
      }

      return this.userModel.update(id, updates);
    } catch (error) {
      logger.error('Error updating user', { error, id });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get user
      const user = await this.userModel.getById(id);

      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Verify current password
      if (!user.password) {
        throw AppError.badRequest('Cannot change password for this user');
      }

      const isPasswordValid = await this.userModel.comparePassword(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        throw AppError.badRequest('Current password is incorrect');
      }

      // Update password
      return this.userModel.updatePassword(id, newPassword);
    } catch (error) {
      logger.error('Error changing password', { error, id });
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(userId: string): string {
    return jwt.sign(
      { id: userId },
      config.jwt.secret,
      { expiresIn: "7d" }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { id: userId },
      config.jwt.secret,
      { expiresIn: "30d" }
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): string | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
      return decoded.id;
    } catch (error) {
      logger.error('Error verifying token', { error });
      return null;
    }
  }
}

export const userService = new UserService();