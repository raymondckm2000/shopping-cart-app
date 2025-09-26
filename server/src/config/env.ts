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

const optionalEnv = (key: string): string | undefined => {
  const value = process.env[key];
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : value;
};

const serverRoot = path.resolve(__dirname, '..', '..');
const resolvedUploadDir = process.env.UPLOAD_DIR
  ? path.resolve(serverRoot, process.env.UPLOAD_DIR)
  : path.resolve(serverRoot, 'uploads');

let cachedDatabaseUrl: string | undefined;
let isDatabaseUrlLoaded = false;

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'production',
  port: Number(process.env.PORT ?? 3000),
  get databaseUrl(): string | undefined {
    if (!isDatabaseUrlLoaded) {
      cachedDatabaseUrl = optionalEnv('DATABASE_URL');
      isDatabaseUrlLoaded = true;
    }

    return cachedDatabaseUrl;
  },
  jwtSecret: requireEnv('JWT_SECRET'),
  adminUsername: requireEnv('ADMIN_USERNAME'),
  adminPassword: requireEnv('ADMIN_PASSWORD'),
  uploadDir: resolvedUploadDir,
};

export default env;
