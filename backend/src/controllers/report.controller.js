const Invoice = require("../models/Invoice");

exports.getInvoiceReport = async (req, res) => {
    try {
        const match = {
            organizationId: req.user.organizationId,
            isDeleted: false,
        };
        const { from, to } = req.query;
        if (from || to) {
            const start = from ? new Date(from) : null;
            const end = to ? new Date(to) : null;
            if (
                (start && Number.isNaN(start.getTime())) ||
                (end && Number.isNaN(end.getTime())) ||
                (start && end && start > end)
            ) {
                return res.status(400).json({ message: "Invalid report date range" });
            }
            match.createdAt = {};
            if (start) match.createdAt.$gte = start;
            if (end) {
                end.setHours(23, 59, 59, 999);
                match.createdAt.$lte = end;
            }
        }

        const [statusSummary, monthly, customers] = await Promise.all([
            Invoice.aggregate([
                { $match: match },
                { $addFields: { normalizedStatus: { $toLower: { $ifNull: ["$status", "pending"] } } } },
                {
                    $group: {
                        _id: "$normalizedStatus",
                        count: { $sum: 1 },
                        amount: { $sum: "$totalAmount" },
                        paidAmount: {
                            $sum: {
                                $cond: [{ $eq: ["$normalizedStatus", "paid"] }, "$totalAmount", 0],
                            },
                        },
                        outstandingAmount: {
                            $sum: {
                                $cond: [{ $ne: ["$normalizedStatus", "paid"] }, "$totalAmount", 0],
                            },
                        },
                    },
                },
            ]),
            Invoice.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        invoiceCount: { $sum: 1 },
                        billed: { $sum: "$totalAmount" },
                    },
                },
                { $sort: { _id: 1 } },
                { $project: { _id: 0, month: "$_id", invoiceCount: 1, billed: 1 } },
            ]),
            Invoice.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: "$clientName",
                        invoiceCount: { $sum: 1 },
                        billed: { $sum: "$totalAmount" },
                        paid: {
                            $sum: {
                                $cond: [
                                    { $eq: [{ $toLower: "$status" }, "paid"] },
                                    "$totalAmount",
                                    0,
                                ],
                            },
                        },
                    },
                },
                { $sort: { billed: -1 } },
                { $limit: 100 },
                { $project: { _id: 0, customer: "$_id", invoiceCount: 1, billed: 1, paid: 1 } },
            ]),
        ]);

        const summary = statusSummary.reduce(
            (total, status) => ({
                totalInvoices: total.totalInvoices + status.count,
                totalBilled: total.totalBilled + status.amount,
                paid: total.paid + status.paidAmount,
                outstanding: total.outstanding + status.outstandingAmount,
            }),
            { totalInvoices: 0, totalBilled: 0, paid: 0, outstanding: 0 },
        );
        res.status(200).json({ summary, statusSummary, monthly, customers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
