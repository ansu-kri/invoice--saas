const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { getInvoiceReport } = require("../controllers/report.controller");

const router = express.Router();

router.get("/invoices", protect, getInvoiceReport);

module.exports = router;
