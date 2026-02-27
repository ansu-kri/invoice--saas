const express = require("express");
const router = express.Router();
const {protect} = require("../middleware/auth.middleware");
const {createInvoice, getInvoice} = require("../controllers/invoice.controller");


router.post("/", protect, createInvoice)
router.get("/", protect, getInvoice)


module.exports = router;