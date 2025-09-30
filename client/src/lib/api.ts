export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  imageUrl?: string;
}

export interface HeroSettings {
  copy: string;
  backgroundImageUrl?: string;
}

const fallbackOrigin =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const parsedBaseUrl = new URL(rawBaseUrl || '/api', fallbackOrigin);
const normalizedBaseUrl = parsedBaseUrl.href.replace(/\/$/, '');
const baseUrl = normalizedBaseUrl;
const apiOrigin = parsedBaseUrl.origin;

export const resolveImageUrl = (imageUrl?: string): string | undefined => {
  if (!imageUrl) {
    return imageUrl;
  }

  if (/^[a-zA-Z][a-zA-Z+.-]*:/.test(imageUrl) || imageUrl.startsWith('//')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/uploads/')) {
    return `${apiOrigin}${imageUrl}`;
  }

  return imageUrl;
};

const withResolvedImageUrl = (product: Product): Product => ({
  ...product,
  imageUrl: resolveImageUrl(product.imageUrl),
});

const withResolvedHeroImageUrl = (settings: HeroSettings): HeroSettings => ({
  ...settings,
  backgroundImageUrl: resolveImageUrl(settings.backgroundImageUrl),
});

interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const headersToObject = (headers?: HeadersInit): Record<string, string> => {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return { ...(headers as Record<string, string>) };
};

const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const bodyIsFormData = init?.body instanceof FormData;
  const headers = headersToObject(init?.headers);

  if (!bodyIsFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (bodyIsFormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError('Failed to parse server response', response.status);
  }
};

export const getProducts = async (): Promise<Product[]> => {
  const products = await fetchJson<Product[]>('/products');
  return products.map(withResolvedImageUrl);
};

export const getHeroSettings = async (): Promise<HeroSettings> => {
  const settings = await fetchJson<HeroSettings>('/hero');
  return withResolvedHeroImageUrl(settings);
};

export const getProduct = async (id: string): Promise<Product> => {
  const trimmedId = id.trim();

  if (!trimmedId) {
    throw new ApiError('Product id is required', 400);
  }

  try {
    const product = await fetchJson<Product>(`/products/${trimmedId}`);
    return withResolvedImageUrl(product);
  } catch (error) {
    if (error instanceof ApiError && error.status !== 404) {
      throw error;
    }

    const products = await getProducts();
    const product = products.find((item) => item.id === trimmedId);

    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    return withResolvedImageUrl(product);
  }
};

export const login = async ({ username, password }: LoginRequest): Promise<LoginResponse> => {
  if (!username || !password) {
    throw new ApiError('username and password are required', 400);
  }

  return fetchJson<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

interface HeroSettingsInput {
  copy: string;
  imageFile?: File | null;
  removeImage?: boolean;
}

export const updateHeroSettings = async (
  input: HeroSettingsInput,
  token: string,
): Promise<HeroSettings> => {
  if (!token) {
    throw new ApiError('Admin token is required', 401);
  }

  const formData = new FormData();
  formData.append('copy', input.copy);

  if (input.imageFile) {
    formData.append('image', input.imageFile);
  }

  if (input.removeImage) {
    formData.append('removeImage', 'true');
  }

  const settings = await fetchJson<HeroSettings>('/hero', {
    method: 'PUT',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return withResolvedHeroImageUrl(settings);
};

interface ProductInput {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  imageFile?: File | null;
}

const createProductFormData = ({
  name,
  description,
  price,
  stock,
  imageFile,
}: ProductInput) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', String(price));

  if (typeof description === 'string' && description.trim() !== '') {
    formData.append('description', description);
  }

  if (typeof stock === 'number') {
    formData.append('stock', String(stock));
  }

  if (imageFile) {
    formData.append('image', imageFile);
  }

  return formData;
};

export const createProduct = async (
  input: ProductInput,
  token: string,
): Promise<Product> => {
  if (!token) {
    throw new ApiError('Admin token is required', 401);
  }

  const formData = createProductFormData(input);

  return fetchJson<Product>('/products', {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateProduct = async (
  id: string,
  input: ProductInput,
  token: string,
): Promise<Product> => {
  const trimmedId = id.trim();

  if (!trimmedId) {
    throw new ApiError('Product id is required', 400);
  }

  if (!token) {
    throw new ApiError('Admin token is required', 401);
  }

  const formData = createProductFormData(input);

  return fetchJson<Product>(`/products/${trimmedId}`, {
    method: 'PUT',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
