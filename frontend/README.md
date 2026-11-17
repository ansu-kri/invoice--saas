# 🚀 Invoice SaaS - Frontend

Frontend application for Multi-Tenant Invoice SaaS built with Next.js.

## 🛠 Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Axios
- JWT Authentication

---

## 📂 Folder Structure

app/
 ├── (auth)/
 ├── (dashboard)/
components/
hooks/
services/
types/
utils/

---

## 🌐 Environment Variables

Create `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 📦 Installation

```bash
git clone <repo-url>
cd frontend
npm install
npm run dev
```

---

## 🔐 Features

- Secure Login / Register
- Role-Based UI
- Protected Routes
- Invoice CRUD, filters, status updates, PDF downloads, and email delivery
- Organization-scoped customer directory and invoice history
- Verified Razorpay payment history
- Organization-scoped expense management and CSV export
- Persisted invoice/payment notification center
- Date-filtered dashboard and invoice analytics
- Business profile, password, and organization contact settings
- Multi-Tenant Data Isolation
- Clean Dashboard UI

---

## 🚀 Deployment

Frontend deployed on Vercel  
Backend deployed via Docker  
Database: MongoDB Atlas

The frontend expects `NEXT_PUBLIC_API_URL` to include the backend `/api` prefix (for example `http://localhost:5000/api`). Razorpay checkout additionally requires `NEXT_PUBLIC_RAZORPAY_KEY`; payment verification remains server-side.