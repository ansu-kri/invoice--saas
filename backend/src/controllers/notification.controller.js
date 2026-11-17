const mongoose = require("mongoose");
const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
        const organizationId = req.user.organizationId;
        const [total, unreadCount, notifications] = await Promise.all([
            Notification.countDocuments({ organizationId }),
            Notification.countDocuments({ organizationId, readAt: null }),
            Notification.find({ organizationId })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
        ]);
        res.status(200).json({
            total,
            unreadCount,
            page,
            totalPages: Math.ceil(total / limit),
            notifications,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: "Notification not found" });
        }
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.user.organizationId },
            { $set: { readAt: new Date() } },
            { new: true },
        );
        if (!notification) return res.status(404).json({ message: "Notification not found" });
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAllNotificationsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { organizationId: req.user.organizationId, readAt: null },
            { $set: { readAt: new Date() } },
        );
        res.status(200).json({ updated: result.modifiedCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
