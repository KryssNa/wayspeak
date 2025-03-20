// src/api/middlewares/index.ts
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { Express, json, urlencoded } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import config from '../../config';
import logger from '../../utils/logging/logger';

/**
 * Configure and apply middleware to Express application
 */
export function setupMiddlewares(app: Express): void {
    // Security
    app.use(helmet());

    // CORS
    app.use(cors({
        origin: config.frontend.url,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body parsers
    app.use(json({ limit: '10mb' }));
    app.use(urlencoded({ extended: true, limit: '10mb' }));

    // Cookie parser
    app.use(cookieParser());

    // Compression
    app.use(compression());

    // Request logging
    if (config.server.env === 'development') {
        app.use(morgan('dev'));
    } else {
        app.use(morgan('combined', {
            stream: {
            write: (message: string): void => { logger.http(message.trim()); },
            },
        }));
    }

    // Rate limiting
    if (config.server.env === 'production') {
        const limiter = rateLimit({
            windowMs: config.rateLimit.windowMs,
            max: config.rateLimit.max,
            standardHeaders: true,
            legacyHeaders: false,
            message: 'Too many requests, please try again later.',
        });

        app.use('/api', limiter);
    }
}

// src/api/middlewares/error.middleware.ts
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/errors/app-error';

/**
 * Configure and apply error handling middleware to Express application
 */
export function setupErrorHandlers(app: Express): void {
    // 404 handler - for routes that don't exist
    app.use('*', (req: Request, res: Response, next: NextFunction) => {
        res.status(404).json({
            status: 'error',
            message: `Cannot find ${req.method} ${req.originalUrl} on this server`,
        });
    });

    // Global error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
        logger.error('Unhandled error', { error: err, path: req.path });

        // If it's an AppError, use its properties
        if (err instanceof AppError) {
            res.status(err.statusCode).json({
                status: err.statusCode,
                message: err.message,
                ...(config.server.env === 'development' && { stack: err.stack }),
            });
            return;
        }

        // Unknown errors
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.',
            ...(config.server.env === 'development' && {
                error: err.message,
                stack: err.stack
            }),
        });
        return;
    });
}