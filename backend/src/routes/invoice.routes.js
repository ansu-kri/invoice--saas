const express = require("express");
const router = express.Router();
const {protect} = require("../middleware/auth.middleware");
const {createInvoice, getInvoice, updateInvoiceStatus, getDashboardsStats, deleteInvoice} = require("../controllers/invoice.controller");


router.post("/", protect, [
    body("clientName").notEmpty().withMessage("client name is required"),
    body("items").isArray({ min: 1 }).withMessage("Item required"),
], createInvoice)
router.get("/", protect, getInvoice)
router.patch("/:id/status", protect, updateInvoiceStatus);
router.get("/dashboard/stats", protect, getDashboardsStats);
router.delete("/:id", protect, deleteInvoice);


module.exports = router;