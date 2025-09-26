import fs from 'node:fs';
import env from './env.js';

export type StartupCheckStatus = 'passed' | 'warning' | 'failed';

export interface StartupCheckResult {
  name: string;
  status: StartupCheckStatus;
  message?: string;
}

const sensitiveEnvVars: Array<{
  key: 'JWT_SECRET' | 'ADMIN_USERNAME' | 'ADMIN_PASSWORD';
  description: string;
  required: boolean;
  fallbackActive: () => boolean;
  fallbackMessage: string;
}> = [
  {
    key: 'JWT_SECRET',
    description: 'JWT secret',
    required: true,
    fallbackActive: () => env.isUsingDevelopmentJwtSecret,
    fallbackMessage:
      'JWT_SECRET is not set. Using the development fallback secret intended only for local testing.',
  },
  {
    key: 'ADMIN_USERNAME',
    description: 'Admin username',
    required: true,
    fallbackActive: () => env.isUsingDevelopmentAdminUsername,
    fallbackMessage:
      'ADMIN_USERNAME is not set. Using the development fallback username intended only for local testing.',
  },
  {
    key: 'ADMIN_PASSWORD',
    description: 'Admin password',
    required: true,
    fallbackActive: () => env.isUsingDevelopmentAdminPassword,
    fallbackMessage:
      'ADMIN_PASSWORD is not set. Using the development fallback password intended only for local testing.',
  },
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
      uploadDirResult.message = `Upload directory "${env.uploadDir}" was missing and has been created automatically.`;
    } else if (!fs.statSync(env.uploadDir).isDirectory()) {
      uploadDirResult.status = 'failed';
      uploadDirResult.message = `Upload path "${env.uploadDir}" exists but is not a directory.`;
    } else {
      uploadDirResult.message = `Upload directory resolved to "${env.uploadDir}".`;
    }
  } catch (error) {
    uploadDirResult.status = 'failed';
    uploadDirResult.message = `Failed to access upload directory "${env.uploadDir}": ${
      error instanceof Error ? error.message : String(error)
    }`;
  }

  results.push(uploadDirResult);

  results.push({
    name: 'NODE_ENV',
    status: 'passed',
    message: `Running in "${env.nodeEnv}" mode.`,
  });

  if (env.isStrictSecretEnforcementEnabled) {
    results.push({
      name: 'Secret enforcement mode',
      status: 'passed',
      message:
        env.nodeEnv === 'production'
          ? 'Production startup requires secure JWT and admin credentials.'
          : 'Strict secret enforcement is enabled despite NODE_ENV not being "production".',
    });
  } else if (env.allowDevelopmentFallbacksInProduction) {
    results.push({
      name: 'Secret enforcement mode',
      status: 'warning',
      message:
        'Development fallbacks are enabled while NODE_ENV is "production". Admin login remains disabled until secure credentials are configured.',
    });
  } else {
    results.push({
      name: 'Secret enforcement mode',
      status: 'warning',
      message: 'Development fallbacks are enabled because NODE_ENV is not "production".',
    });
  }

  {
    const databaseUrl = env.databaseUrl;
    if (typeof databaseUrl === 'string') {
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
    } else {
      results.push({
        name: 'env:DATABASE_URL',
        status: 'warning',
        message:
          'DATABASE_URL is not set. Persistence-related features remain disabled until a database is configured.',
      });
    }
  }

  sensitiveEnvVars.forEach(({ key, description, required, fallbackActive, fallbackMessage }) => {
    const value = process.env[key];
    const trimmed = typeof value === 'string' ? value.trim() : '';
    const usingFallback = fallbackActive();

    if (!trimmed) {
      if (usingFallback) {
        results.push({
          name: `env:${key}`,
          status: 'warning',
          message: `${fallbackMessage} Set ${key} to a secure value before deploying to production.`,
        });
        return;
      }

      results.push({
        name: `env:${key}`,
        status: required ? 'failed' : 'warning',
        message: required
          ? `${description} is required but not provided. Set ${key} to a secure value in the environment before starting the server.`
          : `${description} is not set. Provide ${key} via the environment for production deployments.`,
      });
      return;
    }

    if (usingFallback) {
      results.push({
        name: `env:${key}`,
        status: 'warning',
        message: `${fallbackMessage} Set ${key} to a secure value before deploying to production.`,
      });
      return;
    }

    results.push({
      name: `env:${key}`,
      status: 'passed',
      message: `${description} provided via environment variable.`,
    });
  });

  return results;
};

export const logStartupCheckResults = (results: StartupCheckResult[]): void => {
  console.log('Running startup checks...');
  results.forEach((result) => {
    const prefix = result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
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
