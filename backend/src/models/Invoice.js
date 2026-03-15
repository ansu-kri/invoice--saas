const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
{
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    clientName: {
        type: String,
        required: true,
    },

    clientEmail: {
        type: String,
    },

    items: [
        {
            description: String,
            quantity: Number,
            price: Number,
        },
    ],

    totalAmount: {
        type: Number,
        required: true,
    },

    status: {
        type: String,
        enum: ["Pending", "Paid", "Overdue"],
        default: "Pending",
    },

    dueDate: {
        type: Date,
        required: true,
    },

    lastReminderSent: {
        type: Date,
    },

    paidAt: {
        type: Date,
    },

    isDeleted: {
        type: Boolean,
        default: false,
    },
},
{ timestamps: true }
);

invoiceSchema.index({ organizationId: 1 });
invoiceSchema.index({ clientName: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);