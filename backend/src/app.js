const express = require("express");
const cors = require("cors");

// const authRoutes = require("./routes/auth.routes");
// const invoiceRoutes = require("./routes/invoice.routes");
// const userRoutes = require("./routes/user.routes");

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Body Parsers
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Test Route
app.get("/", (req, res) => {
  res.send("Invoice SaaS API Running...");
});

// Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/invoices", invoiceRoutes);
// app.use("/api/users", userRoutes);

module.exports = app;