import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

process.env.JWT_SECRET ??= 'integration-test-secret';
process.env.ADMIN_USERNAME ??= 'integration-admin';
process.env.ADMIN_PASSWORD ??= 'integration-password';

const { default: env } = await import('../server/src/config/env');
const { default: createApp } = await import('../server/src/app');
const { default: productsStore } = await import('../server/src/store/productsStore');

describe('root endpoint', () => {
  let server: Server;

  afterEach(async () => {
    if (server) {
      server.close();
      await once(server, 'close');
    }
  });

  it('responds with 200 status code', async () => {
    const app = createApp();
    server = app.listen(0);

    await once(server, 'listening');

    const address = server.address();
    assert.ok(address && typeof address !== 'string', 'Expected address info');

    const response = await fetch(`http://127.0.0.1:${address.port}/`);

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'ok');
  });
});

const runFallbackAuthCheck = async () => {
  const appModuleUrl = new URL('../server/src/app.ts', import.meta.url);
  const envModuleUrl = new URL('../server/src/config/env.ts', import.meta.url);
  const runtimeModuleUrl = new URL('../server/src/config/runtimeChecks.ts', import.meta.url);

  const fallbackScript = `
    import assert from 'node:assert/strict';
    import { once } from 'node:events';
    import createApp from '${appModuleUrl.href}';
    import env from '${envModuleUrl.href}';
    import { hasBlockingStartupFailure, performStartupChecks } from '${runtimeModuleUrl.href}';

    const run = async () => {
      const app = createApp();
      const server = app.listen(0);

      try {
        await once(server, 'listening');

        const address = server.address();
        if (!address || typeof address === 'string') {
          throw new Error('Unable to determine server address');
        }

        const baseUrl = 'http://127.0.0.1:' + address.port;
        const response = await fetch(baseUrl + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: env.adminUsername, password: env.adminPassword }),
        });

        assert.equal(response.status, 503);
        const body = await response.json();
        assert.match(body.message, /fallback credentials/i);

        const startupResults = performStartupChecks();
        assert.equal(hasBlockingStartupFailure(startupResults), false);

        assert.equal(env.areDevelopmentFallbacksAllowed, true);
        assert.equal(env.allowDevelopmentFallbacksInProduction, false);
        assert.equal(env.isStrictSecretEnforcementEnabled, false);

        const jwtCheck = startupResults.find((result) => result.name === 'env:JWT_SECRET');
        assert.ok(jwtCheck && jwtCheck.status === 'warning');

        const adminUserCheck = startupResults.find((result) => result.name === 'env:ADMIN_USERNAME');
        assert.ok(adminUserCheck && adminUserCheck.status === 'warning');

        const adminPasswordCheck = startupResults.find((result) => result.name === 'env:ADMIN_PASSWORD');
        assert.ok(adminPasswordCheck && adminPasswordCheck.status === 'warning');

        const secretEnforcementCheck = startupResults.find(
          (result) => result.name === 'Secret enforcement mode',
        );
        assert.ok(secretEnforcementCheck && secretEnforcementCheck.status === 'warning');
        assert.match(secretEnforcementCheck.message ?? '', /NODE_ENV is not "production"/);
      } finally {
        server.close();
        await once(server, 'close');
      }
    };

    run().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  `;

  const childEnv = { ...process.env, NODE_ENV: 'test' };
  delete childEnv.JWT_SECRET;
  delete childEnv.ADMIN_USERNAME;
  delete childEnv.ADMIN_PASSWORD;
  childEnv.DATABASE_URL ??= 'postgres://integration-test/fallback';

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [
      path.join('server', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      '--eval',
      fallbackScript,
    ], {
      cwd: process.cwd(),
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Fallback auth check failed with exit code ${code}.\nstdout:\n${stdout}\nstderr:\n${stderr}`));
      }
    });
  });
};

const runProductionFallbackAuthCheck = async (
  options: { allowDevelopmentFallbacks?: 'true' | 'false' } = {},
) => {
  const appModuleUrl = new URL('../server/src/app.ts', import.meta.url);
  const envModuleUrl = new URL('../server/src/config/env.ts', import.meta.url);
  const runtimeModuleUrl = new URL('../server/src/config/runtimeChecks.ts', import.meta.url);

  const fallbackScript = `
    import assert from 'node:assert/strict';
    import { once } from 'node:events';
    import createApp from '${appModuleUrl.href}';
    import env from '${envModuleUrl.href}';
    import { hasBlockingStartupFailure, performStartupChecks } from '${runtimeModuleUrl.href}';

    const run = async () => {
      const app = createApp();
      const server = app.listen(0);

      try {
        await once(server, 'listening');

        const address = server.address();
        if (!address || typeof address === 'string') {
          throw new Error('Unable to determine server address');
        }

        const baseUrl = 'http://127.0.0.1:' + address.port;
        const response = await fetch(baseUrl + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: env.adminUsername, password: env.adminPassword }),
        });

        assert.equal(response.status, 503);
        const body = await response.json();
        assert.match(body.message, /fallback credentials/i);

        const startupResults = performStartupChecks();
        assert.equal(hasBlockingStartupFailure(startupResults), false);

        assert.equal(env.areDevelopmentFallbacksAllowed, true);
        assert.equal(env.allowDevelopmentFallbacksInProduction, true);
        assert.equal(env.isStrictSecretEnforcementEnabled, false);

        const secretEnforcementCheck = startupResults.find(
          (result) => result.name === 'Secret enforcement mode',
        );
        assert.ok(secretEnforcementCheck && secretEnforcementCheck.status === 'warning');
        assert.match(secretEnforcementCheck.message ?? '', /NODE_ENV is "production"/);
      } finally {
        server.close();
        await once(server, 'close');
      }
    };

    run().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  `;

  const childEnv = { ...process.env, NODE_ENV: 'production' } as Record<string, string | undefined>;
  const fallbackPreference = options.allowDevelopmentFallbacks ?? 'true';
  childEnv.ALLOW_DEVELOPMENT_FALLBACKS = fallbackPreference;
  delete childEnv.JWT_SECRET;
  delete childEnv.ADMIN_USERNAME;
  delete childEnv.ADMIN_PASSWORD;

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        path.join('server', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
        '--eval',
        fallbackScript,
      ],
      {
        cwd: process.cwd(),
        env: childEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Production fallback auth check failed with exit code ${code}.\nstdout:\n${stdout}\nstderr:\n${stderr}`));
      }
    });
  });
};

const runProductionStartupExpectingFailure = async (
  options: { allowDevelopmentFallbacks?: 'true' | 'false' } = {},
) => {
  const envModuleUrl = new URL('../server/src/config/env.ts', import.meta.url);

  const script = `
    import '${envModuleUrl.href}';
  `;

  const childEnv = {
    ...process.env,
    NODE_ENV: 'production',
  } as Record<string, string | undefined>;

  if (typeof options.allowDevelopmentFallbacks === 'string') {
    childEnv.ALLOW_DEVELOPMENT_FALLBACKS = options.allowDevelopmentFallbacks;
  } else {
    delete childEnv.ALLOW_DEVELOPMENT_FALLBACKS;
  }

  delete childEnv.JWT_SECRET;
  delete childEnv.ADMIN_USERNAME;
  delete childEnv.ADMIN_PASSWORD;

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join('server', 'node_modules', 'tsx', 'dist', 'cli.mjs'), '--eval', script],
      {
        cwd: process.cwd(),
        env: childEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stderr = '';

    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      try {
        assert.notEqual(code, 0);
        assert.match(
          stderr,
          /Missing required environment variable "JWT_SECRET"/,
        );
      } catch (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

describe('Admin authentication with fallback credentials', () => {
  it('rejects login attempts and allows startup when development defaults are active', async () => {
    await runFallbackAuthCheck();
  });

  it('can opt into fallbacks in production via ALLOW_DEVELOPMENT_FALLBACKS', async () => {
    await runProductionFallbackAuthCheck({ allowDevelopmentFallbacks: 'true' });
  });

  it('fails fast in production when fallbacks are not explicitly allowed', async () => {
    await runProductionStartupExpectingFailure();
  });

  it('fails fast in production when fallbacks are explicitly disabled', async () => {
    await runProductionStartupExpectingFailure({ allowDevelopmentFallbacks: 'false' });
  });
});

const cleanupUploads = async () => {
  try {
    const entries = await fs.promises.readdir(env.uploadDir);
    const removableEntries = entries.filter((entry) => entry !== '.gitkeep');
    await Promise.all(
      removableEntries.map((entry) => fs.promises.unlink(path.join(env.uploadDir, entry))),
    );
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw error;
    }
  }
};

const loginAsAdmin = async (baseUrl: string) => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: env.adminUsername,
      password: env.adminPassword,
    }),
  });

  assert.equal(response.status, 200);

  const data = (await response.json()) as { token: string };
  assert.ok(data.token);

  return data.token;
};

const startServer = async () => {
  const app = createApp();
  const server = app.listen(0);
  await once(server, 'listening');

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine server address');
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  return { server, baseUrl };
};

describe('Products API', () => {
  let server: Server;
  let baseUrl: string;
  let adminToken: string;

  beforeEach(async () => {
    productsStore.clear();
    await cleanupUploads();

    const started = await startServer();
    server = started.server;
    baseUrl = started.baseUrl;
    adminToken = await loginAsAdmin(baseUrl);
  });

  afterEach(async () => {
    if (server) {
      server.close();
      await once(server, 'close');
    }

    await cleanupUploads();
  });

  it('returns an empty array when no products exist', async () => {
    const response = await fetch(`${baseUrl}/api/products`);
    assert.equal(response.status, 200);

    const data = (await response.json()) as unknown[];
    assert.equal(Array.isArray(data), true);
    assert.equal(data.length, 0);
  });

  it('returns a product by id', async () => {
    const product = productsStore.create({
      name: 'Stored Product',
      price: 12.34,
      stock: 7,
    });

    const response = await fetch(`${baseUrl}/api/products/${product.id}`);

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      id: string;
      name: string;
      price: number;
      stock: number;
    };

    assert.equal(body.id, product.id);
    assert.equal(body.name, 'Stored Product');
    assert.equal(body.price, 12.34);
    assert.equal(body.stock, 7);
  });

  it('returns 404 when a product is not found', async () => {
    const response = await fetch(`${baseUrl}/api/products/non-existent-id`);

    assert.equal(response.status, 404);
    const body = (await response.json()) as { message: string };
    assert.match(body.message, /Product not found/);
  });

  it('rejects creating a product without required fields and removes uploaded file', async () => {
    const formData = new FormData();
    formData.set('description', 'Missing name and price');
    formData.set('image', new Blob(['test-image'], { type: 'image/png' }), 'test.png');

    const response = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });

    assert.equal(response.status, 400);
    const body = (await response.json()) as { message: string };
    assert.match(body.message, /name and price are required/);

    const uploadedEntries = await fs.promises.readdir(env.uploadDir);
    const storedFiles = uploadedEntries.filter((entry) => entry !== '.gitkeep');
    assert.equal(storedFiles.length, 0);
  });

  it('creates, updates, and deletes a product successfully', async () => {
    const formData = new FormData();
    formData.set('name', 'Test Product');
    formData.set('description', 'A product for testing');
    formData.set('price', '19.99');
    formData.set('stock', '5');
    formData.set('image', new Blob(['test-image'], { type: 'image/png' }), 'test.png');

    const createResponse = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });

    assert.equal(createResponse.status, 201);
    const created = (await createResponse.json()) as {
      id: string;
      name: string;
      price: number;
      imageUrl?: string;
      stock: number;
    };

    assert.ok(created.id);
    assert.equal(created.name, 'Test Product');
    assert.equal(created.price, 19.99);
    assert.equal(created.stock, 5);
    assert.ok(created.imageUrl?.startsWith('/uploads/'));

    if (created.imageUrl) {
      const filePath = path.join(env.uploadDir, path.basename(created.imageUrl));
      assert.equal(fs.existsSync(filePath), true);
    }

    const updateForm = new FormData();
    updateForm.set('name', 'Updated Product');
    updateForm.set('price', '29.99');
    updateForm.set('stock', '2');

    const updateResponse = await fetch(`${baseUrl}/api/products/${created.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: updateForm,
    });

    assert.equal(updateResponse.status, 200);
    const updated = (await updateResponse.json()) as {
      id: string;
      name: string;
      price: number;
      stock: number;
    };

    assert.equal(updated.name, 'Updated Product');
    assert.equal(updated.price, 29.99);
    assert.equal(updated.stock, 2);

    const deleteResponse = await fetch(`${baseUrl}/api/products/${created.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(deleteResponse.status, 204);

    const listResponse = await fetch(`${baseUrl}/api/products`);
    const list = (await listResponse.json()) as unknown[];
    assert.equal(list.length, 0);
  });

  it('returns 401 when missing admin token for protected routes', async () => {
    const formData = new FormData();
    formData.set('name', 'Unauthorized Product');
    formData.set('price', '9.99');

    const response = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      body: formData,
    });

    assert.equal(response.status, 401);
    const body = (await response.json()) as { message: string };
    assert.equal(body.message, 'Unauthorized');
  });

  it('removes new upload when replacing an existing image fails', async () => {
    const createForm = new FormData();
    createForm.set('name', 'Product with image');
    createForm.set('price', '9.99');
    createForm.set('stock', '1');
    createForm.set('image', new Blob(['original-image'], { type: 'image/png' }), 'original.png');

    const createResponse = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      body: createForm,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(createResponse.status, 201);
    const created = (await createResponse.json()) as {
      id: string;
      imageUrl?: string;
    };

    assert.ok(created.id);
    assert.ok(created.imageUrl);

    const existingImagePath = path.join(env.uploadDir, path.basename(created.imageUrl as string));
    assert.equal(fs.existsSync(existingImagePath), true);

    const updateForm = new FormData();
    updateForm.set('name', 'Product with image');
    updateForm.set('price', '19.99');
    updateForm.set('stock', '2');
    updateForm.set('image', new Blob(['new-image'], { type: 'image/png' }), 'new.png');

    const unlinkCalls: string[] = [];
    const originalUnlink = fs.promises.unlink;
    mock.method(fs.promises, 'unlink', async (filePath: string) => {
      unlinkCalls.push(filePath);

      if (unlinkCalls.length === 1) {
        const error = new Error('failed to delete existing image') as NodeJS.ErrnoException;
        error.code = 'EACCES';
        throw error;
      }

      return originalUnlink.call(fs.promises, filePath);
    });

    let updateResponse: globalThis.Response | null = null;
    try {
      updateResponse = await fetch(`${baseUrl}/api/products/${created.id}`, {
        method: 'PUT',
        body: updateForm,
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } finally {
      mock.restoreAll();
    }

    if (!updateResponse) {
      throw new Error('Update response not received');
    }

    assert.equal(updateResponse.status, 500);
    const body = (await updateResponse.json()) as { message: string };
    assert.match(body.message, /Failed to update product image/);

    assert.equal(unlinkCalls.length >= 2, true);
    assert.equal(unlinkCalls[0], existingImagePath);

    const newUploadPath = unlinkCalls[1];
    assert.equal(path.dirname(newUploadPath), env.uploadDir);
    assert.equal(fs.existsSync(newUploadPath), false);
  });
});
