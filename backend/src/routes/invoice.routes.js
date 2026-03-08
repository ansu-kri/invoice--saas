const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { createInvoice, getInvoice, updateInvoiceStatus, getDashboardsStats, deleteInvoice, downloadInvoice,createPaymentOrder, verifyPayment, sendInvoiceToClient } = require("../controllers/invoice.controller");
const { body } = require("express-validator");
const permit = require("../middleware/role.middleware");


router.post(
    "/",
    protect,
    [
        body("clientName").notEmpty().withMessage("client name is required"),
        body("items").isArray({ min: 1 }).withMessage("Item required"),
    ],
    permit("admin", "staff"),
    createInvoice
);
router.get("/", protect, getInvoice)
router.patch("/:id/status", protect, updateInvoiceStatus);
router.get("/dashboard/stats", protect, getDashboardsStats);
router.delete("/:id", protect, permit("admin"), deleteInvoice);
router.get("/:id/download", protect, permit("admin", "staff"), downloadInvoice)
router.post("/:id/create-order", protect, createPaymentOrder);
router.post("/verify-payment", protect, verifyPayment);
router.post("/:invoiceId/send-email", protect, sendInvoiceToClient)

module.exports = router;