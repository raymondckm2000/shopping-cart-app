# 🛒 Online Shopping Cart (for Codex Cloud Agent)

## 1. Project Brief
This project is an **Online Shopping Cart** web application with:
- **Frontend** (React + Vite)
- **Backend** (Node.js + Express)
- **Database** (MongoDB)
- **Storage** (local uploads folder, extendable to cloud)
- **Target Users**: Retail customers (frontend) and Admins (backend).

---

## 2. Agent Instructions
### Context
You are an AI agent running in **Codex Cloud**, connected to this GitHub repository.  
Your role is to **generate, update, and maintain code** for this project, following the instructions below.

### Primary Tasks
- [ ] Initialize frontend (React + Vite + TypeScript).
- [ ] Initialize backend (Node.js + Express + TypeScript).
- [ ] Setup MongoDB model for products `{ name, description, price, imageUrl, stock }`.
- [ ] Create API endpoints:
  - `GET /products` → list all products
  - `POST /products` → add product (with image upload)
  - `PUT /products/:id` → update product
  - `DELETE /products/:id` → delete product
- [ ] Enable image upload & static serving (`/uploads` folder).
- [ ] Build frontend pages:
  - Home page with product listing
  - Product detail page
  - Shopping cart
  - Checkout flow
- [ ] Build backend admin panel (simple UI):
  - Add/Edit/Delete product
  - Upload product image
- [ ] Implement authentication for admin routes (JWT).
- [ ] Add responsive design (mobile / desktop).
- [ ] Add basic test coverage.

---

## 3. Definition of Done ✅
- User can browse products, add to cart, and checkout (frontend).
- Admin can login, create/edit/delete products with image upload (backend).
- MongoDB stores product and order data.
- Unit tests for backend API endpoints pass (`pnpm test`).
- Frontend works in Chrome, Edge, Safari (latest versions).
- Code formatted with ESLint + Prettier, TypeScript enabled.

---

## 4. Quick Start
```bash
# 下載專案
git clone https://github.com/<your-username>/shopping-cart-app.git
cd shopping-cart-app

# 安裝依賴
pnpm install

# 啟動前端
pnpm dev

# 啟動後端
pnpm start
