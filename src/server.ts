import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';

/**
 * CRASH RISK MITIGATION & PROCESS LIFECYCLE:
 * 1. Unhandled Promise Rejections & Uncaught Exceptions:
 *    - Risk: If an async operation throws an unhandled rejection, Node.js may terminate unexpectedly
 *      or leave the process in a compromised state where sockets or open file descriptors leak.
 *    - Mitigation: Register process-level handlers to log the full stack trace and initiate
 *      a controlled graceful shutdown.
 * 2. Dangling Connections on SIGTERM/SIGINT:
 *    - Risk: When deploying or restarting (e.g. Docker, Kubernetes, PM2), abruptly killing the process drops
 *      in-flight customer checkout requests and leaves database write locks dangling.
 *    - Mitigation: Close HTTP server listener first (allowing active requests up to 10s to complete),
 *      disconnect Mongoose cleanly, and exit.
 */

let server: http.Server;

const startServer = async (): Promise<void> => {
  // Connect to Database before opening HTTP port
  await connectDB();

  server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.log(`🚀 drinkPure backend running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
    console.log(`📡 Healthcheck available at: http://localhost:${env.PORT}/api/health`);
  });
};

const handleShutdown = async (signal: string): Promise<void> => {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);

  // Force shutdown after 10s if hanging
  const forceExitTimeout = setTimeout(() => {
    console.error('❌ Forcefully terminating server due to shutdown timeout.');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  if (server) {
    server.close(async () => {
      console.log('🔒 Closed all incoming HTTP connections.');
      await disconnectDB();
      console.log('🏁 Graceful shutdown complete. Exiting.');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

// Lifecycle signals
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Process-level crash catchers
process.on('unhandledRejection', (reason: unknown) => {
  console.error('💥 CRITICAL: Unhandled Promise Rejection detected:', reason);
  handleShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error: Error) => {
  console.error('💥 CRITICAL: Uncaught Exception detected:', error);
  handleShutdown('UNCAUGHT_EXCEPTION');
});

// Launch server
startServer().catch((err) => {
  console.error('❌ Fatal error during server startup:', err);
  process.exit(1);
});
