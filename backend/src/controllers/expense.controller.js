const mongoose = require("mongoose");
const Expense = require("../models/Expense");

const parseDateRange = (from, to) => {
    const start = from ? new Date(from) : null;
    const end = to ? new Date(to) : null;
    if (
        (start && Number.isNaN(start.getTime())) ||
        (end && Number.isNaN(end.getTime())) ||
        (start && end && start > end)
    ) return null;
    if (end) end.setHours(23, 59, 59, 999);
    return { start, end };
};

exports.getExpenses = async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
        const query = { organizationId: req.user.organizationId };
        const search = String(req.query.search || "").trim();
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            query.$or = [
                { description: { $regex: escaped, $options: "i" } },
                { category: { $regex: escaped, $options: "i" } },
                { vendor: { $regex: escaped, $options: "i" } },
            ];
        }
        if (req.query.from || req.query.to) {
            const range = parseDateRange(req.query.from, req.query.to);
            if (!range) return res.status(400).json({ message: "Invalid expense date range" });
            query.date = {};
            if (range.start) query.date.$gte = range.start;
            if (range.end) query.date.$lte = range.end;
        }
        const [total, expenses, summary] = await Promise.all([
            Expense.countDocuments(query),
            Expense.find(query).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            Expense.aggregate([
                { $match: query },
                { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
                { $project: { _id: 0 } },
            ]),
        ]);
        res.status(200).json({
            total,
            page,
            totalPages: Math.ceil(total / limit),
            expenses,
            summary: summary[0] || { totalAmount: 0, count: 0 },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createExpense = async (req, res) => {
    try {
        const { description, category, vendor, amount, date } = req.body;
        const parsedAmount = Number(amount);
        const parsedDate = date ? new Date(date) : new Date();
        if (!String(description || "").trim() || !String(category || "").trim()) {
            return res.status(400).json({ message: "Description and category are required" });
        }
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: "Expense amount must be greater than zero" });
        }
        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: "Expense date is invalid" });
        }
        const expense = await Expense.create({
            organizationId: req.user.organizationId,
            createdBy: req.user._id,
            description: String(description).trim(),
            category: String(category).trim(),
            vendor: String(vendor || "").trim(),
            amount: parsedAmount,
            date: parsedDate,
        });
        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: "Expense not found" });
        }
        const updates = {};
        for (const field of ["description", "category", "vendor"]) {
            if (req.body[field] !== undefined) updates[field] = String(req.body[field]).trim();
        }
        if (req.body.amount !== undefined) updates.amount = Number(req.body.amount);
        if (req.body.date !== undefined) updates.date = new Date(req.body.date);
        if (updates.description !== undefined && !updates.description) {
            return res.status(400).json({ message: "Description is required" });
        }
        if (updates.category !== undefined && !updates.category) {
            return res.status(400).json({ message: "Category is required" });
        }
        if (updates.amount !== undefined && (!Number.isFinite(updates.amount) || updates.amount <= 0)) {
            return res.status(400).json({ message: "Expense amount must be greater than zero" });
        }
        if (updates.date && Number.isNaN(updates.date.getTime())) {
            return res.status(400).json({ message: "Expense date is invalid" });
        }
        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.user.organizationId },
            { $set: updates },
            { new: true, runValidators: true },
        );
        if (!expense) return res.status(404).json({ message: "Expense not found" });
        res.status(200).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: "Expense not found" });
        }
        const expense = await Expense.findOneAndDelete({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        });
        if (!expense) return res.status(404).json({ message: "Expense not found" });
        res.status(200).json({ message: "Expense deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
