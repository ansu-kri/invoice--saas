const Payment = require("../models/Payment");

exports.getPayments = async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
        const query = { organizationId: req.user.organizationId };
        const { from, to } = req.query;

        if (from || to) {
            const start = from ? new Date(from) : null;
            const end = to ? new Date(to) : null;
            if (
                (start && Number.isNaN(start.getTime())) ||
                (end && Number.isNaN(end.getTime())) ||
                (start && end && start > end)
            ) {
                return res.status(400).json({ message: "Invalid payment date range" });
            }
            query.paidAt = {};
            if (start) query.paidAt.$gte = start;
            if (end) {
                end.setHours(23, 59, 59, 999);
                query.paidAt.$lte = end;
            }
        }

        const [total, payments, summary] = await Promise.all([
            Payment.countDocuments(query),
            Payment.find(query)
                .populate("invoiceId", "clientName totalAmount status")
                .sort({ paidAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Payment.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$amount" },
                        totalPayments: { $sum: 1 },
                    },
                },
                { $project: { _id: 0 } },
            ]),
        ]);

        res.status(200).json({
            total,
            page,
            totalPages: Math.ceil(total / limit),
            payments,
            summary: summary[0] || { totalAmount: 0, totalPayments: 0 },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
