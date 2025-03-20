// src/bootstrap.ts
import express, { Express } from 'express';
import databaseService from './config/database';
import logger from './utils/logging/logger';
import { setupRoutes } from './api/routes';
import { setupErrorHandlers, setupMiddlewares } from './api/middlewares';

/**
 * Bootstrap the application
 */
export async function bootstrap(): Promise<Express> {
  try {
    // Initialize Express app
    const app = express();
    
    // Connect to the database
    await databaseService.connect();
    
    // Setup middleware
    setupMiddlewares(app);
    
    // Setup routes
    setupRoutes(app);
    
    // Setup error handlers - this should be after routes
    setupErrorHandlers(app);
    
    return app;
  } catch (error) {
    logger.error('Failed to bootstrap application', { error });
    throw error;
  }
}

/**
 * Graceful shutdown function
 */
export async function shutdown(): Promise<void> {
  try {
    // Close database connection
    await databaseService.close();
    
    // Add any other cleanup operations here
    
    logger.info('Application shutdown complete');
  } catch (error) {
    logger.error('Error during application shutdown', { error });
    process.exit(1);
  }
}