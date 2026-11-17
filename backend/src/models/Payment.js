const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        provider: {
            type: String,
            enum: ["razorpay"],
            required: true,
        },
        providerOrderId: {
            type: String,
            required: true,
        },
        providerPaymentId: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["captured"],
            required: true,
        },
        paidAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

paymentSchema.index({ organizationId: 1, createdAt: -1 });
paymentSchema.index({ organizationId: 1, invoiceId: 1 });
paymentSchema.index({ providerPaymentId: 1 }, { unique: true });

module.exports = mongoose.model("Payment", paymentSchema);
