// src/core/models/user.model.ts
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import databaseService from '../../config/database';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface IUser {
  _id?: ObjectId;
  name: string;
  email: string;
  password?: string;
  companyName?: string;
  role: UserRole;
  status: UserStatus;
  whatsappPhoneNumber?: string;
  whatsappBusinessId?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for user data returned to the client (excluding sensitive fields)
export interface IUserResponse {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  role: UserRole;
  status: UserStatus;
  whatsappPhoneNumber?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  private collection = 'users';

  /**
   * Create a new user
   */
  async create(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const db = databaseService.getDb();

    const now = new Date();
    const newUser: IUser = {
      ...userData,
      role: userData.role || UserRole.USER,
      status: userData.status || UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    // Hash password if provided
    if (newUser.password) {
      newUser.password = await this.hashPassword(newUser.password);
    }

    const result = await db.collection(this.collection).insertOne(newUser);

    return {
      ...newUser,
      _id: result.insertedId,
    };
  }

  /**
   * Get a user by ID
   */
  async getById(id: string): Promise<IUser | null> {
    const db = databaseService.getDb();

    return db.collection(this.collection).findOne({
      _id: new ObjectId(id),
    }) as Promise<IUser | null>;
  }

  /**
   * Get a user by email
   */
  async getByEmail(email: string): Promise<IUser | null> {
    const db = databaseService.getDb();

    return db.collection(this.collection).findOne({
      email: email.toLowerCase(),
    }) as Promise<IUser | null>;
  }

  /**
   * Update a user
   */
  async update(id: string, updates: Partial<IUser>): Promise<boolean> {
    const db = databaseService.getDb();

    // Don't allow updating these fields directly
    const { _id, password, role, createdAt, ...validUpdates } = updates as any;

    validUpdates.updatedAt = new Date();

    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: validUpdates }
    );

    return result.modifiedCount > 0;
  }

  /**
 * Get a user by WhatsApp phone number
 */
async getByWhatsAppNumber(whatsappNumber: string): Promise<IUser | null> {
  const db = databaseService.getDb();
  
  return db.collection(this.collection).findOne({
    whatsappPhoneNumber: whatsappNumber,
  }) as Promise<IUser | null>;
}

  /**
   * Update a user's password
   */
  async updatePassword(id: string, password: string): Promise<boolean> {
    const db = databaseService.getDb();

    const hashedPassword = await this.hashPassword(password);

    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Update last login time
   */
  async updateLastLogin(id: string): Promise<boolean> {
    const db = databaseService.getDb();

    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Compare provided password with stored hash
   */
  async comparePassword(providedPassword: string, storedPassword: string): Promise<boolean> {
    return bcrypt.compare(providedPassword, storedPassword);
  }

  /**
   * Hash a password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Convert a user document to a safe response object (without password)
   */
  toResponse(user: IUser): IUserResponse {
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      _id: userWithoutPassword._id!.toString(),
    };
  }
}