const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// CORS Configuration (Production Safe)
const allowedOrigins = [
  "http://localhost:3000", // local dev
  process.env.FRONTEND_URL, // production frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Body Parser
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("Invoice SaaS API Running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);

// Error Middleware
app.use(errorHandler);

module.exports = app;