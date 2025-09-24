import { randomUUID } from 'node:crypto';
import { CreateProductInput, Product, UpdateProductInput } from '../models/product.js';

class ProductsStore {
  private products: Product[] = [];

  getAll() {
    return this.products;
  }

  create(input: CreateProductInput) {
    const now = new Date();
    const product: Product = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      price: input.price,
      imageUrl: input.imageUrl,
      stock: input.stock ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    this.products.push(product);
    return product;
  }

  update(id: string, input: UpdateProductInput) {
    const index = this.products.findIndex((product) => product.id === id);

    if (index === -1) {
      return null;
    }

    const existing = this.products[index];
    const updated: Product = {
      ...existing,
      name: input.name,
      description: input.description ?? existing.description,
      price: input.price,
      imageUrl: input.imageUrl === null ? undefined : input.imageUrl ?? existing.imageUrl,
      stock: input.stock ?? existing.stock,
      updatedAt: new Date(),
    };

    this.products[index] = updated;
    return updated;
  }

  delete(id: string) {
    const index = this.products.findIndex((product) => product.id === id);

    if (index === -1) {
      return null;
    }

    const [removed] = this.products.splice(index, 1);
    return removed;
  }

  findById(id: string) {
    return this.products.find((product) => product.id === id) ?? null;
  }

  clear() {
    this.products = [];
  }
}

const productsStore = new ProductsStore();

export default productsStore;
export { ProductsStore };
