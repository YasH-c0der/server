import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * CRASH RISK MITIGATION:
 * Risk: Missing or malformed environment variables (e.g., undefined MONGO_URI, invalid PORT)
 * can cause runtime crashes or silent security vulnerabilities during production execution.
 * Mitigation: Validate process.env schema synchronously at startup before any other module loads.
 * If validation fails, log the exact missing keys and terminate immediately (fail-fast).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) {
      throw new Error(`Invalid PORT value: ${val}`);
    }
    return parsed;
  }),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters for security'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment validation failed. Please check your .env configuration:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
export type EnvConfig = z.infer<typeof envSchema>;
