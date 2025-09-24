import crypto from 'node:crypto';

export interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

export interface JwtPayload {
  [key: string]: unknown;
  iat?: number;
  exp?: number;
}

const base64UrlEncode = (input: Buffer): string =>
  input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const base64UrlDecode = (input: string): Buffer => {
  const padLength = (4 - (input.length % 4)) % 4;
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength);
  return Buffer.from(padded, 'base64');
};

const safeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');

  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

export const signJwt = (
  payload: Record<string, unknown>,
  secret: string,
  options?: { expiresInSeconds?: number },
): string => {
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
  const issuedAt = Math.floor(Date.now() / 1000);

  const fullPayload: JwtPayload = {
    ...payload,
    iat: issuedAt,
  };

  if (options?.expiresInSeconds) {
    fullPayload.exp = issuedAt + options.expiresInSeconds;
  }

  const encodedHeader = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(fullPayload)));

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(signingInput).digest(),
  );

  return `${signingInput}.${signature}`;
};

export const verifyJwt = (token: string, secret: string): JwtPayload => {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid token');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(signingInput).digest(),
  );

  if (!safeCompare(signature, expectedSignature)) {
    throw new Error('Invalid token signature');
  }

  const headerJson = base64UrlDecode(encodedHeader).toString('utf8');
  const header = JSON.parse(headerJson) as JwtHeader;

  if (header.alg !== 'HS256') {
    throw new Error('Unsupported token algorithm');
  }

  const payloadJson = base64UrlDecode(encodedPayload).toString('utf8');
  const payload = JSON.parse(payloadJson) as JwtPayload;

  if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) {
    throw new Error('Token expired');
  }

  return payload;
};
