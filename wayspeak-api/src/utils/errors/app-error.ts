// src/utils/errors/app-error.ts

/**
 * Custom application error class
 * Provides standardized error handling across the application
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly details: any;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.details = details;


    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message: string): AppError {
    return new AppError(message, 401);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message: string): AppError {
    return new AppError(message, 403);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message: string): AppError {
    return new AppError(message, 404);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  /**
   * Create a 422 Unprocessable Entity error
   */
  static validation(message: string): AppError {
    return new AppError(message, 422);
  }

  /**
   * Create a 429 Too Many Requests error
   */
  static tooManyRequests(message: string): AppError {
    return new AppError(message, 429);
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(message: string): AppError {
    return new AppError(message, 500);
  }

  /**
   * Create a 503 Service Unavailable error
   */
  static serviceUnavailable(message: string): AppError {
    return new AppError(message, 503);
  }
}