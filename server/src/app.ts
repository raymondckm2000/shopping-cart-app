// @ts-nocheck
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import env from './config/env.js';
import healthRouter from './routes/health.js';
import productsRouter from './routes/products.js';
import authRouter from './routes/auth.js';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use('/uploads', express.static(env.uploadDir));

  const rootHandler: express.RequestHandler = (_req, res) => {
    res.json({ status: 'ok' });
  };

  app.get('/', rootHandler);
  app.head('/', rootHandler);

  app.get('/api', (_req: express.Request, res: express.Response) => {
    const response = res as express.Response;

    response.json({
      name: 'Shopping Cart API',
      version: '0.1.0',
      status: 'online',
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/products', productsRouter);

  return app;
};

export default createApp;
