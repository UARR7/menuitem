import 'dotenv/config';
import { createApp } from './app';
import { createPool, testConnection, closePool } from './config/database';
import { config } from './config/app';
import { logger } from './utils/logger';

const bootstrap = async (): Promise<void> => {
  try {
    // Initialise DB pool + verify connectivity
    createPool();
    await testConnection();

    const app = createApp();
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Menu Management Service running on port ${config.port} [${config.env}]`);
      logger.info(`   API prefix: ${config.apiPrefix}`);
    });

    // ── Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal} — shutting down gracefully...`);
      server.close(async () => {
        await closePool();
        logger.info('Server closed. Goodbye.');
        process.exit(0);
      });

      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

bootstrap();
