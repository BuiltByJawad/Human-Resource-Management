import './module-alias';
import 'reflect-metadata';
import { createApp } from './app';
import { prisma } from './app';
import { logger } from '@/shared/config/logger';
import { PORT, NODE_ENV } from '@/shared/config/config';

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Start the server
const startServer = async () => {
  try {
    const { httpServer } = createApp();

    // Start listening
    const server = httpServer.listen(PORT, () => {
      logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');

      // Close the HTTP server
      server.close(async () => {
        logger.info('Server closed');

        // Close database connection
        await prisma.$disconnect();
        logger.info('Database connection closed');

        process.exit(0);
      });

      // Force close server after 5 seconds
      setTimeout(() => {
        logger.error('Forcing server shutdown');
        process.exit(1);
      }, 5000);
    };

    // Handle termination signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    logger.error(`Failed to start server: ${(err as Error).message}`);
    process.exit(1);
  }
};

// Start the application
startServer();
