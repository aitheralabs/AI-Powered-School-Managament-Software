import http from 'http';
import app from './app';
import env from './config/env';
import { testConnection, closePool } from './database/connection';
import { initSocketServer } from './socket/socketServer';
import logger from './utils/logger';

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.fatal('Failed to connect to database — exiting');
      process.exit(1);
    }

    // Create HTTP server and attach Socket.io
    const httpServer = http.createServer(app);
    initSocketServer(httpServer);

    // Start server
    httpServer.listen(env.PORT, () => {
      logger.info('Server started', {
        port: env.PORT,
        environment: env.NODE_ENV,
        health: `http://localhost:${env.PORT}/health`,
        api: `http://localhost:${env.PORT}/api/v1`,
      });
    });

    // Graceful shutdown — give in-flight requests up to 30 s to complete,
    // then force-exit so the container orchestrator can restart cleanly.
    let isShuttingDown = false;
    const gracefulShutdown = (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info('Graceful shutdown initiated', { signal });

      const forceExitTimer = setTimeout(() => {
        logger.fatal('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 30_000);
      forceExitTimer.unref();

      httpServer.close(async () => {
        logger.info('HTTP server closed');
        try {
          await closePool();
          logger.info('Graceful shutdown completed');
          clearTimeout(forceExitTimer);
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error: (error as Error).message });
          clearTimeout(forceExitTimer);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.fatal('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.fatal('Unhandled Promise Rejection', { reason: String(reason) });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

startServer();
