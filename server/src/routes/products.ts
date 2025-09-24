import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';
import env from '../config/env';
import productsStore from '../store/productsStore';

const router = express.Router();

fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

const upload = multer({ storage });

const buildImageUrl = (filename: string) => `/uploads/${filename}`;

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

router.get('/', (_req, res) => {
  const products = productsStore.getAll();
  res.json(products);
});

router.post('/', upload.single('image'), async (req, res) => {
  const { name, description, price, stock } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ message: 'name and price are required' });
  }

  let parsedPrice: number;
  let parsedStock: number;

  try {
    parsedPrice = parseNumberField(price, 'price');
    parsedStock = parseNumberField(stock ?? 0, 'stock');
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }

  const imageUrl = req.file ? buildImageUrl(req.file.filename) : undefined;

  const product = productsStore.create({
    name,
    description,
    price: parsedPrice,
    stock: parsedStock,
    imageUrl,
  });

  return res.status(201).json(product);
});

router.put('/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const existing = productsStore.findById(id);

  if (!existing) {
    await removeUploadedFile(req.file);
    return res.status(404).json({ message: 'Product not found' });
  }

  const { name, description, price, stock } = req.body;

  if (!name || price === undefined) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: 'name and price are required' });
  }

  let parsedPrice: number;
  let parsedStock: number;

  try {
    parsedPrice = parseNumberField(price, 'price');
    parsedStock = parseNumberField(stock ?? existing.stock, 'stock');
  } catch (error) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: (error as Error).message });
  }

  let newImageUrl: string | undefined;

  if (req.file) {
    newImageUrl = buildImageUrl(req.file.filename);
    try {
      await removeImageFile(existing.imageUrl);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to update product image' });
    }
  }

  const updated = productsStore.update(id, {
    name,
    description,
    price: parsedPrice,
    stock: parsedStock,
    imageUrl: req.file ? newImageUrl : undefined,
  });

  if (!updated) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const removed = productsStore.delete(id);

  if (!removed) {
    return res.status(404).json({ message: 'Product not found' });
  }

  try {
    await removeImageFile(removed.imageUrl);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete product image' });
  }

  return res.status(204).send();
});

export default router;
