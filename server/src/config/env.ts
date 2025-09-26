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
codex/enhance-security-for-admin-credentials
  databaseUrl:
    process.env.DATABASE_URL ??
    'mongodb+srv://raymondckm2000_db_user:NYKpt9WEEYEU15OF@cluster0.hyxlahl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  jwtSecret: requireEnv('JWT_SECRET'),
  adminUsername: requireEnv('ADMIN_USERNAME'),
  adminPassword: requireEnv('ADMIN_PASSWORD'),

  get databaseUrl(): string {
    if (cachedDatabaseUrl === undefined) {
      cachedDatabaseUrl = getRequiredEnvVar('DATABASE_URL');
    }

    return cachedDatabaseUrl;
  },
  jwtSecret: process.env.JWT_SECRET ?? 'mySuperSecretKey_123!@#',
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
main
  uploadDir: resolvedUploadDir,
};

export default env;
