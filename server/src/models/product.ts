export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductInput = {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock?: number;
};

export type UpdateProductInput = {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string | null;
  stock?: number;
};
