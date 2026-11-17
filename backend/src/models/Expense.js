const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        description: { type: String, required: true, trim: true, maxlength: 200 },
        category: { type: String, required: true, trim: true, maxlength: 80 },
        vendor: { type: String, trim: true, maxlength: 120 },
        amount: { type: Number, required: true, min: 0.01 },
        date: { type: Date, required: true, default: Date.now },
    },
    { timestamps: true },
);

expenseSchema.index({ organizationId: 1, date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
