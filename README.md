# 🛒 Online Shopping Cart (GitHub + Codex Cloud Only)

## 1. Overview
This project is an **Online Shopping Cart** web application designed to run fully on **GitHub + Codex Cloud**.  
No local development is required. All code will be generated, updated, and maintained by **Codex Cloud Agent**.  

- **Frontend**: React + Vite  
- **Backend**: Node.js + Express  
- **Database**: MongoDB (cloud-based, e.g. MongoDB Atlas)  
- **Storage**: Local `/uploads` folder or cloud storage (e.g. Cloudinary, S3)  
- **Target Users**: Retail customers (frontend) and Admins (backend).  

---

## 2. Project Workflow
1. Update this `README.md` with new requirements (Features, Roadmap, or Agent Notes).  
2. Run **Codex Cloud Agent (Full Access)**.  
3. Agent will:  
   - Read this file  
   - Generate/update code in this repo  
   - Commit and push changes automatically  
4. Deploy to cloud platform (Vercel for frontend, Render/Railway for backend).  

---

## 3. Environment
Environment variables will be stored on **cloud deployment platforms** only.  

Example `.env.example` file (committed to repo for reference):  
PORT=3000
DATABASE_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/shopping_cart
JWT_SECRET=secret123
UPLOAD_DIR=uploads

⚠️ Do not commit `.env` files with real secrets.  
Use **Vercel / Render / Railway / Codex Cloud Project Settings** to configure actual values.

For the Vite frontend, copy `client/.env.example` to `client/.env` and set `VITE_API_BASE_URL` to your backend URL (defaults to `http://localhost:3000/api`).  

---

## 4. Project Structure
The structure is managed entirely by **Codex Cloud Agent**.  
Expected layout:  

/client # Frontend (React + Vite)
/server # Backend (Node.js + Express)
/tests # Automated tests
README.md


---

## 5. Features (User Stories)
- [x] Customer: Browse products with images, name, price  
- [x] Customer: Add/remove/update items in cart  
- [x] Customer: Checkout flow (address + payment placeholder)  
- [ ] Admin: Login/Logout with JWT  
- [ ] Admin: Add/Edit/Delete products  
- [ ] Admin: Upload product images  
- [ ] System: Store data in MongoDB Atlas  
- [x] System: Responsive UI (mobile + desktop)  

---

## 6. Definition of Done ✅
- Frontend and backend code live inside this repository.  
- Customer flow (browse → add to cart → checkout) is functional.  
- Admin flow (login → manage products → upload image) is functional.  
- Database integrated (MongoDB Atlas).  
- Tests added for backend API.  
- Code formatted with ESLint + Prettier.  

---

## 7. Agent Notes
- You are an AI agent running in **Codex Cloud Full Access mode**.  
- Your responsibilities:  
  - Generate TypeScript code for both frontend and backend  
  - Create API routes under `/server/routes/`  
  - Create React components under `/client/components/`  
  - Implement JWT authentication for admin routes  
  - Use `multer` for image uploads (saved in `/server/uploads/`)  
  - Write tests in `/tests/` folder  
  - Update this `README.md` when features are added/changed  
- Commit messages must follow **Conventional Commits** (e.g. `feat: add product CRUD API`).
- 禁止建立分支，請直接 commit main
- 🚫 禁止建立 PR，請直接 commit 到 main。

---

## 8. Frontend Preview (Placeholder)
![Storefront placeholder](docs/screenshots/frontend-placeholder.svg)

---

## 9. Roadmap
- [ ] Deploy frontend to Vercel (connected to `client/`)
- [ ] Deploy backend to Render or Railway (connected to `server/`)
- [ ] Add Stripe/PayPal payment integration
- [ ] Add order history for customers
- [ ] Add product categories and search
- [ ] Add analytics dashboard for admin

---

## 10. Render Troubleshooting
- **Accessing logs after a failed deploy**
  - Open the service in the [Render Dashboard](https://dashboard.render.com/), select the failing deploy from the **Events** tab, and inspect the real-time logs at the bottom of the page.
  - Alternatively install the [Render CLI](https://render.com/docs/render-cli) and run `render login`, then fetch logs with `render logs --service <service-id> --tail` to stream the most recent output from the instance.
  - For historical context or sharing with support, append `--since 30m` (or another window) to pull logs from the specified time range.
- **Log contents**: The backend emits structured startup diagnostics and captures `uncaughtException` / `unhandledRejection` events, so all fatal setup errors appear in the Render log stream.

---
