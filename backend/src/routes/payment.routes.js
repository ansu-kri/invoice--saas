const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { getPayments } = require("../controllers/payment.controller");

const router = express.Router();

router.get("/", protect, getPayments);

module.exports = router;
