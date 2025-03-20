// src/api/middlewares/error.middleware.ts

import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/errors/app-error';
import logger from '../../utils/logging/logger';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Error caught by middleware', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    request: {
      path: req.path,
      method: req.method,
      ip: req.ip,
      query: req.query,
      body: req.body,
    },
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      details: err.details,
      code: err.name,
    });
    return;
  }

  // Handle MongoDB duplicate key errors
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    res.status(409).json({
      status: 'error',
      message: `${field} already exists`,
      details: {
        field,
        value: (err as any).keyValue[field],
      },
      code: 'DUPLICATE_KEY_ERROR',
    });
    return;
  }

  // Handle ValidationError (library specific, adapt as needed)
  if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'error',
      message: 'Validation error',
      details: err,
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'error',
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // Handle SyntaxError for JSON parsing
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid JSON',
      code: 'INVALID_JSON',
    });
    return;
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    let statusCode = 400;

    switch ((err as any).code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the limit';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name';
        break;
      default:
        message = (err as any).message;
    }

    res.status(statusCode).json({
      status: 'error',
      message,
      code: (err as any).code,
    });
    return;
  }

  // Default to 500 internal server error for unhandled errors
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    status: 'error',
    message: isProduction ? 'Internal server error' : err.message,
    code: 'INTERNAL_SERVER_ERROR',
    ...(isProduction ? {} : { stack: err.stack }),
  });
}