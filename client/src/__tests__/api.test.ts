import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

declare module 'vitest' {
  interface TestContext {
    restoreFetch?: () => void;
  }
}

const importApiModule = async () => {
  return import('../lib/api');
};

beforeEach((context) => {
  vi.resetModules();
  vi.unstubAllEnvs();

  const originalFetch = globalThis.fetch;
  context.restoreFetch = () => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      delete (globalThis as { fetch?: typeof fetch }).fetch;
    }
  };
});

afterEach((context) => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  context.restoreFetch?.();
});

describe('resolveImageUrl', () => {
  it('returns undefined when no imageUrl is provided', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api');
    const { resolveImageUrl } = await importApiModule();

    expect(resolveImageUrl(undefined)).toBeUndefined();
  });

  it('keeps absolute URLs unchanged', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api');
    const { resolveImageUrl } = await importApiModule();

    expect(resolveImageUrl('https://cdn.example.com/image.jpg')).toBe(
      'https://cdn.example.com/image.jpg',
    );
    expect(resolveImageUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
  });

  it('prefixes relative upload paths with the API origin', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/v1');
    const { resolveImageUrl } = await importApiModule();

    expect(resolveImageUrl('/uploads/items/photo.png')).toBe(
      'https://api.example.com/uploads/items/photo.png',
    );
  });
});

describe('getProducts', () => {
  it('resolves relative image paths when fetching products', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://remote.example.com/api');

    const mockProducts = [
      { id: '1', name: 'Test Product', price: 10, imageUrl: '/uploads/images/1.png' },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProducts,
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { getProducts } = await importApiModule();

    const products = await getProducts();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://remote.example.com/api/products',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      imageUrl: 'https://remote.example.com/uploads/images/1.png',
    });
  });
});
