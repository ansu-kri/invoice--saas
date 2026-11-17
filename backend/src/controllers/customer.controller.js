const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const invoiceMatchFor = (customer) => ({
    organizationId: customer.organizationId,
    isDeleted: false,
    $or: [
        { customerId: customer._id },
        { clientName: { $regex: `^${escapeRegex(customer.name)}$`, $options: "i" } },
        ...(customer.email
            ? [{ clientEmail: { $regex: `^${escapeRegex(customer.email)}$`, $options: "i" } }]
            : []),
    ],
});

exports.getCustomers = async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
        const search = String(req.query.search || "").trim();
        const query = { organizationId: req.user.organizationId, isDeleted: false };
        if (search) {
            const pattern = new RegExp(escapeRegex(search), "i");
            query.$or = [{ name: pattern }, { email: pattern }];
        }

        const [total, customers] = await Promise.all([
            Customer.countDocuments(query),
            Customer.aggregate([
                { $match: query },
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit },
                {
                    $lookup: {
                        from: "invoices",
                        let: { id: "$_id", name: "$name", email: "$email", org: "$organizationId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$organizationId", "$$org"] },
                                            { $eq: ["$isDeleted", false] },
                                            {
                                                $or: [
                                                    { $eq: ["$customerId", "$$id"] },
                                                    { $eq: [{ $toLower: "$clientName" }, { $toLower: "$$name" }] },
                                                    {
                                                        $and: [
                                                            { $ne: [{ $ifNull: ["$$email", ""] }, ""] },
                                                            {
                                                                $eq: [
                                                                    { $toLower: { $ifNull: ["$clientEmail", ""] } },
                                                                    { $toLower: "$$email" },
                                                                ],
                                                            },
                                                        ],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                            { $addFields: { normalizedStatus: { $toLower: { $ifNull: ["$status", "pending"] } } } },
                            {
                                $group: {
                                    _id: null,
                                    invoiceCount: { $sum: 1 },
                                    totalBilled: { $sum: "$totalAmount" },
                                    totalPaid: {
                                        $sum: {
                                            $cond: [{ $eq: ["$normalizedStatus", "paid"] }, "$totalAmount", 0],
                                        },
                                    },
                                },
                            },
                        ],
                        as: "invoiceStats",
                    },
                },
                {
                    $addFields: {
                        invoiceStats: {
                            $ifNull: [
                                { $arrayElemAt: ["$invoiceStats", 0] },
                                { invoiceCount: 0, totalBilled: 0, totalPaid: 0 },
                            ],
                        },
                    },
                },
                { $project: { name: 1, email: 1, phone: 1, address: 1, createdAt: 1, invoiceStats: 1 } },
            ]),
        ]);
        res.status(200).json({ total, page, totalPages: Math.ceil(total / limit), customers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCustomer = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: "Customer not found" });
        }
        const customer = await Customer.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
            isDeleted: false,
        }).lean();
        if (!customer) return res.status(404).json({ message: "Customer not found" });

        const [invoices, totals] = await Promise.all([
            Invoice.find(invoiceMatchFor(customer)).sort({ createdAt: -1 }).limit(50).lean(),
            Invoice.aggregate([
                { $match: invoiceMatchFor(customer) },
                { $addFields: { normalizedStatus: { $toLower: { $ifNull: ["$status", "pending"] } } } },
                {
                    $group: {
                        _id: null,
                        invoiceCount: { $sum: 1 },
                        totalBilled: { $sum: "$totalAmount" },
                        totalPaid: {
                            $sum: {
                                $cond: [{ $eq: ["$normalizedStatus", "paid"] }, "$totalAmount", 0],
                            },
                        },
                    },
                },
            ]),
        ]);
        const summary = totals[0] || { invoiceCount: 0, totalBilled: 0, totalPaid: 0 };
        res.status(200).json({
            customer,
            invoices,
            summary: { ...summary, outstanding: summary.totalBilled - summary.totalPaid },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Customer name is required" });
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "Customer email is invalid" });
        }
        const customer = await Customer.create({
            organizationId: req.user.organizationId,
            name: String(name).trim(),
            email: email ? String(email).trim().toLowerCase() : undefined,
            phone,
            address,
        });
        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const updates = {};
        for (const field of ["name", "email", "phone", "address"]) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        if (updates.name !== undefined) {
            updates.name = String(updates.name).trim();
            if (!updates.name) return res.status(400).json({ message: "Customer name is required" });
        }
        if (updates.email) {
            updates.email = String(updates.email).trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
                return res.status(400).json({ message: "Customer email is invalid" });
            }
        }
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.user.organizationId, isDeleted: false },
            { $set: updates },
            { new: true, runValidators: true },
        );
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.user.organizationId, isDeleted: false },
            { $set: { isDeleted: true } },
            { new: true },
        );
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        res.status(200).json({ message: "Customer deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
