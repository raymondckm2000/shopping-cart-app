const isBrowser = typeof document !== 'undefined';

const escapeCookieName = (name: string) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getCookie = (name: string): string | null => {
  if (!isBrowser) {
    return null;
  }

  const pattern = new RegExp(`(?:^|; )${escapeCookieName(name)}=([^;]*)`);
  const match = document.cookie.match(pattern);

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

type SameSiteOption = 'Strict' | 'Lax' | 'None' | 'strict' | 'lax' | 'none';

interface CookieOptions {
  maxAgeSeconds?: number;
  path?: string;
  secure?: boolean;
  sameSite?: SameSiteOption;
}

export const setCookie = (name: string, value: string, options?: CookieOptions) => {
  if (!isBrowser) {
    return;
  }

  const parts = [`${name}=${encodeURIComponent(value)}`];
  const path = options?.path ?? '/';
  parts.push(`Path=${path}`);

  if (typeof options?.maxAgeSeconds === 'number') {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`);
  }

  if (options?.secure) {
    parts.push('Secure');
  }

  if (options?.sameSite) {
    const sameSiteValue = options.sameSite;
    const normalizedSameSite =
      typeof sameSiteValue === 'string' && sameSiteValue.length > 0
        ? `${sameSiteValue[0].toUpperCase()}${sameSiteValue.slice(1).toLowerCase()}`
        : undefined;

    if (normalizedSameSite) {
      parts.push(`SameSite=${normalizedSameSite}`);
    }
  }

  document.cookie = parts.join('; ');
};

export const deleteCookie = (name: string, path = '/') => {
  if (!isBrowser) {
    return;
  }

  document.cookie = `${name}=; Path=${path}; Max-Age=0`;
};

export default {
  getCookie,
  setCookie,
  deleteCookie,
};
