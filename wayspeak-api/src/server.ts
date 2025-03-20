// src/server.ts
import { bootstrap, shutdown } from './app';
import logger from './utils/logging/logger';
import config from './config';

async function startServer() {
  try {
    const app = await bootstrap();
    
    const server = app.listen(config.server.port, () => {
      logger.info(`Server running in ${config.server.env} mode on port ${config.server.port}`);
    });
    
    // Handle graceful shutdown
    const signalHandlers = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signalHandlers.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`${signal} received, shutting down gracefully`);
        
        server.close(async () => {
          logger.info('HTTP server closed');
          await shutdown();
          process.exit(0);
        });
        
        // Force shutdown after 10 seconds if graceful shutdown fails
        setTimeout(() => {
          logger.error('Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 10000);
      });
    });
    
    // Handle uncaught exceptions and rejections
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', {
          promise,
          reason,
          stack: reason instanceof Error ? reason.stack : undefined
        });
      });
    
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();