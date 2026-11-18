# 🚀 Invoice SaaS - Backend

Backend service for Multi-Tenant Invoice SaaS application.

## 🛠 Tech Stack

- Node.js
- Express.js
- MongoDB (MongoDB Atlas)
- Mongoose
- JWT Authentication
- Docker
- CORS
- bcrypt

---

## 🏗 Architecture

- Multi-tenant architecture
- Role-based access control (Admin / Member)
- JWT-based authentication
- Organization-based data isolation
- REST API structure
- Organization-scoped customers, invoices, verified payments, and reporting

---

## 📂 Project Structure

src/
 ├── config/
 ├── controllers/
 ├── middleware/
 ├── models/
 ├── routes/
 ├── utils/
 └── app.js

server.js

---

## 🔐 Authentication Flow

1. Admin registers
2. Organization is created automatically
3. User is linked with organizationId
4. JWT token is generated
5. Protected routes verify token & organization

---

## API modules

All API routes are prefixed with `/api`.

- `/auth` - register and sign in
- `/invoices` - invoice CRUD, filtered listing, dashboard aggregates, PDF, email, and Razorpay order/verification
- `/customers` - organization-scoped customer records and invoice history
- `/payments` - captured Razorpay payment history and date-filtered totals
- `/reports/invoices` - invoice status, monthly, and customer revenue aggregates
- `/users` - profile, password, and admin-managed team members
- `/organizations/current` - organization business contact details (admin updates)
- `/expenses` - organization-scoped expense records and totals
- `/notifications` - persisted organization notifications and read state

Payment status is only recorded after the Razorpay signature and captured payment details are verified. Payment history contains captured provider transactions; manually changed invoice statuses do not create payment records.

## 📦 Installation

```bash
git clone <repo-url>
cd backend
npm install
```

Create `.env` file:

```
PORT=5000
MONGO_URL=your_mongodb_connection
JWT_SECRET=your_secret
FRONTEND_URL=http://localhost:3000
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Invoice SaaS <billing@your-verified-domain.com>
INVOICE_CURRENCY_SYMBOL=
```

Run:

```bash
npm start
```

---

## 🐳 Docker Setup

Build Image:

```bash
docker build -t invoice-backend .
```

Run Container:

```bash
docker run -p 5000:5000 invoice-backend
```

---

## 🔮 Future Improvements

- PDF Invoice Generation
- Email Notifications
- Redis Caching
- Kubernetes Deployment