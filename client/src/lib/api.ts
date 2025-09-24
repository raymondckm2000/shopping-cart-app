export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  imageUrl?: string;
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');
const baseUrl = normalizedBaseUrl || '/api';

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

const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
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
  return fetchJson<Product[]>('/products');
};

export const getProduct = async (id: string): Promise<Product> => {
  const trimmedId = id.trim();

  if (!trimmedId) {
    throw new ApiError('Product id is required', 400);
  }

  try {
    return await fetchJson<Product>(`/products/${trimmedId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status !== 404) {
      throw error;
    }

    const products = await getProducts();
    const product = products.find((item) => item.id === trimmedId);

    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    return product;
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
