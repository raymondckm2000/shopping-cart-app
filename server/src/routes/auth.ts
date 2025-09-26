// @ts-nocheck
import express from 'express';
import env from '../config/env.js';
import { signJwt } from '../lib/jwt.js';

const router = express.Router();

router.post('/login', (req: express.Request, res: express.Response) => {
  const request = req as express.Request & {
    body?: Record<string, unknown>;
  };
  const response = res as express.Response;
  const body = (request.body ?? {}) as Record<string, string | undefined>;
  const username = body.username;
  const password = body.password;

  if (!username || !password) {
    return response.status(400).json({ message: 'username and password are required' });
  }

  if (env.isUsingDevelopmentAdminCredentials) {
    return response.status(503).json({
      message:
        'Admin login is disabled because development fallback credentials are in use. Configure ADMIN_USERNAME and ADMIN_PASSWORD before attempting to sign in.',
    });
  }

  if (username !== env.adminUsername || password !== env.adminPassword) {
    return response.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signJwt(
    { username, role: 'admin' },
    env.jwtSecret,
    { expiresInSeconds: 60 * 60 },
  );

  return response.json({ token });
});

export default router;
