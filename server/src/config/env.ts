import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const serverRoot = path.resolve(__dirname, '..', '..');
const resolvedUploadDir = process.env.UPLOAD_DIR
  ? path.resolve(serverRoot, process.env.UPLOAD_DIR)
  : path.resolve(serverRoot, 'uploads');

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
  uploadDir: resolvedUploadDir,
};

export default env;
