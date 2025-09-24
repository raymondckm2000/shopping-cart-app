// @ts-nocheck
import express from 'express';

const router = express.Router();

router.get('/', (_req: express.Request, res: express.Response) => {
  const response = res as express.Response;

  response.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
