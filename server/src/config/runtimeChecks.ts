import fs from 'node:fs';
import env from './env.js';

export type StartupCheckStatus = 'passed' | 'warning' | 'failed';

export interface StartupCheckResult {
  name: string;
  status: StartupCheckStatus;
  message?: string;
}

const sensitiveEnvVars: Array<{ key: string; description: string }> = [
  { key: 'JWT_SECRET', description: 'JWT secret' },
  { key: 'ADMIN_USERNAME', description: 'Admin username' },
  { key: 'ADMIN_PASSWORD', description: 'Admin password' },
];

export const performStartupChecks = (): StartupCheckResult[] => {
  const results: StartupCheckResult[] = [];

  if (Number.isFinite(env.port) && env.port > 0) {
    results.push({
      name: 'PORT configuration',
      status: 'passed',
      message: `Using port ${env.port}.`,
    });
  } else {
    results.push({
      name: 'PORT configuration',
      status: 'failed',
      message: `Invalid port value: ${env.port}.`,
    });
  }

  const uploadDirResult: StartupCheckResult = {
    name: 'Upload directory availability',
    status: 'passed',
  };

  try {
    if (!fs.existsSync(env.uploadDir)) {
      fs.mkdirSync(env.uploadDir, { recursive: true });
      uploadDirResult.status = 'warning';
      uploadDirResult.message = `Upload directory \"${env.uploadDir}\" was missing and has been created automatically.`;
    } else if (!fs.statSync(env.uploadDir).isDirectory()) {
      uploadDirResult.status = 'failed';
      uploadDirResult.message = `Upload path \"${env.uploadDir}\" exists but is not a directory.`;
    } else {
      uploadDirResult.message = `Upload directory resolved to \"${env.uploadDir}\".`;
    }
  } catch (error) {
    uploadDirResult.status = 'failed';
    uploadDirResult.message = `Failed to access upload directory \"${env.uploadDir}\": ${
      error instanceof Error ? error.message : String(error)
    }`;
  }

  results.push(uploadDirResult);

  results.push({
    name: 'NODE_ENV',
    status: 'passed',
    message: `Running in \"${env.nodeEnv}\" mode.`,
  });

  try {
    const databaseUrl = env.databaseUrl;
    results.push({
      name: 'env:DATABASE_URL',
      status: 'passed',
      message: 'Database connection string provided via environment variable.',
    });

    if (!databaseUrl.trim()) {
      results.push({
        name: 'env:DATABASE_URL format',
        status: 'warning',
        message: 'DATABASE_URL is empty after trimming whitespace.',
      });
    }
  } catch (error) {
    results.push({
      name: 'env:DATABASE_URL',
      status: 'failed',
      message:
        error instanceof Error
          ? error.message
          : 'Missing required environment variable: DATABASE_URL',
    });
  }

  sensitiveEnvVars.forEach(({ key, description }) => {
    if (!process.env[key]) {
      results.push({
        name: `env:${key}`,
        status: 'warning',
        message: `${description} is not set. Falling back to the default value defined in code.`,
      });
    } else {
      results.push({
        name: `env:${key}`,
        status: 'passed',
        message: `${description} provided via environment variable.`,
      });
    }
  });

  return results;
};

export const logStartupCheckResults = (results: StartupCheckResult[]): void => {
  console.log('Running startup checks...');
  results.forEach((result) => {
    const prefix =
      result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    if (result.message) {
      console.log(`${prefix} ${result.name}: ${result.message}`);
    } else {
      console.log(`${prefix} ${result.name}`);
    }
  });
};

export const hasBlockingStartupFailure = (results: StartupCheckResult[]): boolean =>
  results.some((result) => result.status === 'failed');

export const registerProcessEventHandlers = (): void => {
  if (process.listenerCount('unhandledRejection') === 0) {
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled promise rejection detected:', reason);
    });
  }

  if (process.listenerCount('uncaughtException') === 0) {
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception detected:', error);
    });
  }

  if (process.listenerCount('SIGTERM') === 0) {
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM. Shutting down gracefully.');
      process.exit(0);
    });
  }
};
