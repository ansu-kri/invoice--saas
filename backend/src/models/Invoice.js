const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        require: true,
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
        enum: ["draft", "sent" , "paid"],
        default: "draft",
    },
}, {timestamps: true}
);

module.exports = mongoose.model("Invoice", invoiceSchema)