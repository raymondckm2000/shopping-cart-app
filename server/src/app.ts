import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import env from './config/env';
import healthRouter from './routes/health';
import productsRouter from './routes/products';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use('/uploads', express.static(env.uploadDir));

  app.get('/api', (_req, res) => {
    res.json({
      name: 'Shopping Cart API',
      version: '0.1.0',
      status: 'online',
    });
  });

  app.use('/api/health', healthRouter);
  app.use('/api/products', productsRouter);

  return app;
};

export default createApp;
