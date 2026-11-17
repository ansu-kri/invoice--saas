const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        type: {
            type: String,
            enum: ["invoice", "payment", "system"],
            required: true,
        },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        message: { type: String, required: true, trim: true, maxlength: 300 },
        href: { type: String, trim: true, maxlength: 200 },
        readAt: { type: Date, default: null },
    },
    { timestamps: true },
);

notificationSchema.index({ organizationId: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
