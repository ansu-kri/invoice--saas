const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { createInvoice, getInvoice, getInvoiceById, updateInvoice, updateInvoiceStatus, getDashboardsStats, deleteInvoice, downloadInvoice,createPaymentOrder, verifyPayment, sendInvoiceToClient,reminderService } = require("../controllers/invoice.controller");
const { body } = require("express-validator");
const permit = require("../middleware/role.middleware");


router.post(
    "/",
    protect,
    [
        body("clientName").trim().notEmpty().withMessage("client name is required"),
        body("clientEmail").optional({ checkFalsy: true }).isEmail().withMessage("client email must be valid"),
        body("items").isArray({ min: 1 }).withMessage("Item required"),
        body("items.*.description").trim().notEmpty().withMessage("Item description is required"),
        body("items.*.quantity").isFloat({ gt: 0 }).withMessage("Item quantity must be positive"),
        body("items.*.price").isFloat({ min: 0 }).withMessage("Item price cannot be negative"),
    ],
    permit("admin", "staff"),
    createInvoice
);
router.get("/", protect, getInvoice)
router.get("/reminder-service", protect, permit("admin"), reminderService)
router.get("/dashboard/stats", protect, getDashboardsStats);
router.get("/:id", protect, getInvoiceById);
router.patch("/:id", protect, permit("admin", "staff"), updateInvoice);
router.patch("/:id/status", protect, updateInvoiceStatus);
router.delete("/:id", protect, permit("admin"), deleteInvoice);
router.get("/:id/download", protect, permit("admin", "staff"), downloadInvoice)
router.post("/:id/create-order", protect, createPaymentOrder);
router.post("/verify-payment", protect, verifyPayment);
router.post("/:invoiceId/send-email", protect, sendInvoiceToClient)

module.exports = router;