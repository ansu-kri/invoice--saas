const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes")
const invoiceRoutes = require("./routes/invoice.routes");
// const protect = require("./middleware/auth.middleware")

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

// Test Route
app.get("/", (req, res) => {
  res.send("Invoice SaaS API Running...");
});

// app.get("/api/test-protected", protect, (req,res) => {
//   res.json({ message: "Protected route working", user: req.user,

//   })
// })

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
// app.use("/api/users", userRoutes);

module.exports = app;