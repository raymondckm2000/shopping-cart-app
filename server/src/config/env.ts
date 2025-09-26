import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import path from 'node:path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `Missing required environment variable "${key}". Please provide a secure value before starting the server.`,
    );
  }

  return value;
};

const nodeEnv = process.env.NODE_ENV ?? 'production';
const isProduction = nodeEnv === 'production';

const serverRoot = path.resolve(__dirname, '..', '..');
const resolvedUploadDir = process.env.UPLOAD_DIR
  ? path.resolve(serverRoot, process.env.UPLOAD_DIR)
  : path.resolve(serverRoot, 'uploads');

let cachedDatabaseUrl: string | undefined;

type FallbackKey = 'jwtSecret' | 'adminUsername' | 'adminPassword';

const fallbackUsage: Record<FallbackKey, boolean> = {
  jwtSecret: false,
  adminUsername: false,
  adminPassword: false,
};

const getEnvOrDevelopmentFallback = (
  key: 'JWT_SECRET' | 'ADMIN_USERNAME' | 'ADMIN_PASSWORD',
  fallbackValue: string,
  usageKey: FallbackKey,
): string => {
  const value = process.env[key];

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  if (isProduction) {
    throw new Error(
      `Missing required environment variable "${key}". Please provide a secure value before starting the server.`,
    );
  }

  fallbackUsage[usageKey] = true;
  return fallbackValue;
};

const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3000),
  get databaseUrl(): string {
    if (cachedDatabaseUrl === undefined) {
      cachedDatabaseUrl = requireEnv('DATABASE_URL');
    }

    return cachedDatabaseUrl;
  },
  jwtSecret: getEnvOrDevelopmentFallback('JWT_SECRET', 'development-jwt-secret', 'jwtSecret'),
  adminUsername: getEnvOrDevelopmentFallback('ADMIN_USERNAME', 'admin', 'adminUsername'),
  adminPassword: getEnvOrDevelopmentFallback('ADMIN_PASSWORD', 'password', 'adminPassword'),
  uploadDir: resolvedUploadDir,
  get isUsingDevelopmentJwtSecret(): boolean {
    return fallbackUsage.jwtSecret;
  },
  get isUsingDevelopmentAdminUsername(): boolean {
    return fallbackUsage.adminUsername;
  },
  get isUsingDevelopmentAdminPassword(): boolean {
    return fallbackUsage.adminPassword;
  },
  get isUsingDevelopmentAdminCredentials(): boolean {
    return fallbackUsage.adminUsername || fallbackUsage.adminPassword;
  },
  get developmentFallbacks(): Readonly<Record<FallbackKey, boolean>> {
    return { ...fallbackUsage };
  },
};

export default env;
