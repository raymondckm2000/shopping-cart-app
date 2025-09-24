import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, it } from 'node:test';
import env from '../server/src/config/env';
import createApp from '../server/src/app';
import productsStore from '../server/src/store/productsStore';
import { signJwt } from '../server/src/lib/jwt';

const cleanupUploads = async () => {
  try {
    const entries = await fs.promises.readdir(env.uploadDir);
    await Promise.all(
      entries.map((entry) => fs.promises.unlink(path.join(env.uploadDir, entry)))
    );
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw error;
    }
  }
};

describe('Products API', () => {
  let server: Server;
  let baseUrl: string;
  let adminToken: string;

  beforeEach(async () => {
    productsStore.clear();
    await cleanupUploads();

    const app = createApp();
    server = app.listen(0);
    await once(server, 'listening');

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Unable to determine server address');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
    adminToken = signJwt({ username: 'admin', role: 'admin' }, env.jwtSecret);
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

  it('rejects creating a product without required fields', async () => {
    const formData = new FormData();
    formData.set('description', 'Missing name and price');

    const response = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(response.status, 400);
    const body = (await response.json()) as { message: string };
    assert.match(body.message, /name and price are required/);
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
      body: formData,
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
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
      body: updateForm,
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
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
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(deleteResponse.status, 204);

    const listResponse = await fetch(`${baseUrl}/api/products`);
    const list = (await listResponse.json()) as unknown[];
    assert.equal(list.length, 0);
  });
});
