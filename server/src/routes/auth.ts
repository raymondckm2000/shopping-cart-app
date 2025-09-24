// @ts-nocheck
import express from 'express';
import env from '../config/env';
import { signJwt } from '../lib/jwt';

const router = express.Router();

router.post('/login', (req: express.Request, res: express.Response) => {
  const request = req as express.Request & {
    body?: Record<string, unknown>;
  };
  const response = res as express.Response;
  const { username, password } = (request.body ?? {}) as Record<string, string | undefined>;

  if (!username || !password) {
    return response.status(400).json({ message: 'username and password are required' });
  }

  if (username !== env.adminUsername || password !== env.adminPassword) {
    return response.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signJwt(
    {
      username,
      role: 'admin',
    },
    env.jwtSecret,
    { expiresInSeconds: 60 * 60 },
  );

  return response.json({ token });
});

export default router;
