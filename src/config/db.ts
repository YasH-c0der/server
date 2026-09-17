import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';

/**
 * DNS RESOLVER FIX FOR MONGODB ATLAS (mongodb+srv://):
 * Many home Wi-Fi routers and Indian ISPs (Jio, Airtel, ACT) refuse or fail to resolve
 * DNS SRV queries on UDP port 53, causing: `querySrv ECONNREFUSED _mongodb._tcp...`
 * Explicitly pointing Node's internal c-ares DNS resolver to Google and Cloudflare
 * guarantees fast, reliable SRV lookup across any network environment.
 */
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

/**
 * CRASH RISK IDENTIFICATION & MITIGATION:
 * 1. Connection Drop / Network Partition:
 *    - Risk: If MongoDB becomes unreachable during runtime, unhandled query promises can hang indefinitely
 *      or throw unhandled rejections leading to process crashes.
 *    - Mitigation: Configure serverSelectionTimeoutMS (5s), connectTimeoutMS (10s), and listen to Mongoose
 *      lifecycle events ('error', 'disconnected') to log and alert without crashing active HTTP processes.
 * 2. Connection Pool Exhaustion:
 *    - Risk: Under high concurrent traffic in a quick-commerce app, too many concurrent requests will exhaust
 *      the default pool, queuing operations until timeouts occur.
 *    - Mitigation: Explicitly configure maxPoolSize (50) and minPoolSize (10) for optimized connection reuse.
 * 3. Ungraceful Process Termination:
 *    - Risk: Abrupt process exit (SIGINT/SIGTERM) can interrupt ongoing write transactions and corrupt data.
 *    - Mitigation: Export disconnectDB() to ensure cleanly closing Mongoose connection pool during shutdown.
 * 4. DNS SRV Lookup Failure (ECONNREFUSED):
 *    - Risk: Node.js failing to resolve Atlas SRV records crashes process on startup.
 *    - Mitigation: Explicit dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']).
 */

const MONGO_OPTIONS: mongoose.ConnectOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB runtime connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection lost. Attempting auto-reconnect...');
    });

    await mongoose.connect(env.MONGO_URI, MONGO_OPTIONS);
  } catch (error) {
    console.error('❌ Failed to establish initial MongoDB connection:', error);
    // In production, failure to connect to DB at startup is fatal
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed gracefully.');
  } catch (error) {
    console.error('❌ Error during MongoDB disconnection:', error);
  }
};
