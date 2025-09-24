// @ts-nocheck
import express from 'express';
import type { NextFunction } from 'express';
import env from '../config/env.js';
import { verifyJwt, type JwtPayload as BaseJwtPayload } from '../lib/jwt.js';

export interface AuthenticatedRequest extends express.Request {
  user?: JwtPayload;
}

export interface JwtPayload extends BaseJwtPayload {
  username: string;
  role: string;
}

const extractTokenFromHeader = (authorization?: string): string | null => {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
};

export const requireAdmin = (
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) => {
  const request = req as express.Request;
  const response = res as express.Response;
  const token = extractTokenFromHeader(request.get('authorization') ?? undefined);

  if (!token) {
    return response.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = verifyJwt(token, env.jwtSecret) as JwtPayload;

    if (payload.role !== 'admin') {
      return response.status(403).json({ message: 'Forbidden' });
    }

    (request as AuthenticatedRequest).user = payload;

    return next();
  } catch (error) {
    return response.status(401).json({ message: 'Invalid token' });
  }
};

export default requireAdmin;
