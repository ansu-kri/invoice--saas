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

## 📦 Installation

```bash
git clone <repo-url>
cd backend
npm install
```

Create `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret
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