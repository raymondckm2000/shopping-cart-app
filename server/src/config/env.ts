import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import path from 'node:path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const serverRoot = path.resolve(__dirname, '..', '..');
const resolvedUploadDir = process.env.UPLOAD_DIR
  ? path.resolve(serverRoot, process.env.UPLOAD_DIR)
  : path.resolve(serverRoot, 'uploads');

const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

let cachedDatabaseUrl: string | undefined;

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'production',
  port: Number(process.env.PORT ?? 3000),
  get databaseUrl(): string {
    if (cachedDatabaseUrl === undefined) {
      cachedDatabaseUrl = getRequiredEnvVar('DATABASE_URL');
    }

    return cachedDatabaseUrl;
  },
  jwtSecret: process.env.JWT_SECRET ?? 'mySuperSecretKey_123!@#',
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
  uploadDir: resolvedUploadDir,
};

export default env;
