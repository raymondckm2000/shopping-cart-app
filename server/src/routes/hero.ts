// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import type { MulterFile } from 'multer';
import env from '../config/env.js';
import heroSettingsStore from '../store/heroSettingsStore.js';
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

const removeUploadedFile = async (file?: MulterFile | null) => {
  if (!file) {
    return;
  }

  let filePath = file.path;

  if (!filePath) {
    const { filename } = file;
    const destination = file.destination ?? env.uploadDir;

    if (!filename || !destination) {
      return;
    }

    filePath = path.join(destination, filename);
  }

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw error;
    }
  }
};

router.get('/', (_req: express.Request, res: express.Response) => {
  const response = res as express.Response;
  const settings = heroSettingsStore.get();
  response.json(settings);
});

router.put('/', requireAdmin, upload.single('image'), async (req: express.Request, res: express.Response) => {
  const request = req as express.Request & {
    body: Record<string, unknown>;
    file?: MulterFile;
  };
  const response = res as express.Response;
  const body = (request.body ?? {}) as Record<string, unknown>;
  const copy = body.copy as string | undefined;
  const removeImageFlag = body.removeImage;
  const removeImage = removeImageFlag === 'true' || removeImageFlag === true || removeImageFlag === '1';

  const existing = heroSettingsStore.get();

  if (request.file) {
    const newImageUrl = buildImageUrl(request.file.filename);

    if (existing.backgroundImageUrl) {
      try {
        await removeImageFile(existing.backgroundImageUrl);
      } catch (error) {
        await removeUploadedFile(request.file);
        return response.status(500).json({ message: 'Failed to update hero image' });
      }
    }

    const updated = heroSettingsStore.update({
      copy,
      backgroundImageUrl: newImageUrl,
    });

    return response.json(updated);
  }

  if (removeImage && existing.backgroundImageUrl) {
    try {
      await removeImageFile(existing.backgroundImageUrl);
    } catch (error) {
      return response.status(500).json({ message: 'Failed to remove hero image' });
    }
  }

  const updated = heroSettingsStore.update({
    copy,
    backgroundImageUrl: removeImage ? null : undefined,
  });

  return response.json(updated);
});

export default router;
