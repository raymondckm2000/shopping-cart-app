// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import type { MulterFile } from 'multer';
import env from '../config/env.js';
import productsStore from '../store/productsStore.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (
    _req: express.Request,
    _file: MulterFile,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    cb(null, env.uploadDir);
  },
  filename: (
    _req: express.Request,
    file: MulterFile,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

const upload = multer({ storage });

const buildImageUrl = (filename: string) => `/uploads/${filename}`;

type ProductRequest = express.Request & {
  body: Record<string, unknown>;
  params: Record<string, string>;
  file?: MulterFile;
};

const asProductRequest = (req: express.Request): ProductRequest => req as ProductRequest;
const asResponse = (res: express.Response): express.Response => res as express.Response;

const parseNumberField = (value: unknown, fieldName: string) => {
  const parsed = Number(value ?? 0);

  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a number`);
  }

  return parsed;
};

const removeImageFile = async (imageUrl?: string) => {
  if (!imageUrl) {
    return;
  }

  const filename = path.basename(imageUrl);
  const filePath = path.join(env.uploadDir, filename);

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw error;
    }
  }
};

const removeUploadedFile = async (file?: { path: string } | null) => {
  if (!file) {
    return;
  }

  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw error;
    }
  }
};

router.get('/', (_req: express.Request, res: express.Response) => {
  const response = asResponse(res);
  const products = productsStore.getAll();
  response.json(products);
});

router.get('/:id', (req: express.Request, res: express.Response) => {
  const request = asProductRequest(req);
  const response = asResponse(res);
  const params = request.params as Record<string, string>;
  const { id } = params;

  const product = productsStore.findById(id);

  if (!product) {
    return response.status(404).json({ message: 'Product not found' });
  }

  return response.json(product);
});

router.post('/', requireAdmin, upload.single('image'), async (req: express.Request, res: express.Response) => {
  const request = asProductRequest(req);
  const response = asResponse(res);
  const body = (request.body ?? {}) as Record<string, unknown>;
  const name = body.name as string | undefined;
  const description = body.description as string | undefined;
  const price = body.price;
  const stock = body.stock;

  if (!name || price === undefined) {
    return response.status(400).json({ message: 'name and price are required' });
  }

  let parsedPrice: number;
  let parsedStock: number;

  try {
    parsedPrice = parseNumberField(price, 'price');
    parsedStock = parseNumberField(stock ?? 0, 'stock');
  } catch (error) {
    return response.status(400).json({ message: (error as Error).message });
  }

  const imageUrl = request.file ? buildImageUrl(request.file.filename) : undefined;

  const product = productsStore.create({
    name,
    description,
    price: parsedPrice,
    stock: parsedStock,
    imageUrl,
  });

  return response.status(201).json(product);
});

router.put('/:id', requireAdmin, upload.single('image'), async (req: express.Request, res: express.Response) => {
  const request = asProductRequest(req);
  const response = asResponse(res);
  const params = request.params as Record<string, string>;
  const { id } = params;
  const existing = productsStore.findById(id);

  if (!existing) {
    await removeUploadedFile(request.file);
    return response.status(404).json({ message: 'Product not found' });
  }

  const body = (request.body ?? {}) as Record<string, unknown>;
  const name = body.name as string | undefined;
  const description = body.description as string | undefined;
  const price = body.price;
  const stock = body.stock;

  if (!name || price === undefined) {
    await removeUploadedFile(request.file);
    return response.status(400).json({ message: 'name and price are required' });
  }

  let parsedPrice: number;
  let parsedStock: number;

  try {
    parsedPrice = parseNumberField(price, 'price');
    parsedStock = parseNumberField(stock ?? existing.stock, 'stock');
  } catch (error) {
    await removeUploadedFile(request.file);
    return response.status(400).json({ message: (error as Error).message });
  }

  let newImageUrl: string | undefined;

  if (request.file) {
    newImageUrl = buildImageUrl(request.file.filename);
    try {
      await removeImageFile(existing.imageUrl);
    } catch (error) {
      return response.status(500).json({ message: 'Failed to update product image' });
    }
  }

  const updated = productsStore.update(id, {
    name,
    description,
    price: parsedPrice,
    stock: parsedStock,
    imageUrl: request.file ? newImageUrl : undefined,
  });

  if (!updated) {
    return response.status(404).json({ message: 'Product not found' });
  }

  return response.json(updated);
});

router.delete('/:id', requireAdmin, async (req: express.Request, res: express.Response) => {
  const request = asProductRequest(req);
  const response = asResponse(res);
  const params = request.params as Record<string, string>;
  const { id } = params;

  const removed = productsStore.delete(id);

  if (!removed) {
    return response.status(404).json({ message: 'Product not found' });
  }

  try {
    await removeImageFile(removed.imageUrl);
  } catch (error) {
    return response.status(500).json({ message: 'Failed to delete product image' });
  }

  return response.status(204).send();
});

export default router;
