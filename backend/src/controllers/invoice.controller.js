const Invoice = require("../models/Invoice");
const { validationResult } = require("express-validator")


//==============CreateInvoice======================
exports.createInvoice = async (req, res) => {
    try {
        const { clientName, clientEmail, items } = req.body;

        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        const totalAmount = items.reduce((acc, item) => acc + item.quantity * item.price, 0);

        //creating the invoice
        const invoice = await Invoice.create({
            //we do not take organizationId from body, we take req.user.organizationId ,,,because this prevent tenant data leakage.

            organizationId: req.user.organizationId,
            createdBy: req.user._id,
            clientName,
            clientEmail,
            items,
            totalAmount,
        })
        res.status(201).json(invoice)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//=====================Get AllInvoice (pagination and search by client name)=====================
exports.getInvoice = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";

        const skip = (page - 1) * limit;
        const query = {
            organizationId: req.user.organizationId, isDeleted: false,
            clientName: { $regex: search, $options: "i" } //case insensitive search
        };
        const total = await Invoice.countDocuments(query);

        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            total,
            page,
            totalPages: Math.ceil(total / limit),
            invoices,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
//we are filtering = organizationId: req.user.organizationId

//=====================Update status invoice===========
exports.updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;

        // Role check
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const invoice = await Invoice.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId, // tenant safety
                isDeleted: false,
            },
            { status },
            { new: true }
        );

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        res.status(200).json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//============Add Dashboard Controller==============
exports.getDashboardsStats = async (req, res) => {
    try {
        const orgId = req.user.organizationId;

        const stats = await Invoice.aggregate([
            {
                $match: {
                    organizationId: orgId,
                    isDeleted: false
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    paidRevenue: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "paid"] }, "$totalAmount", 0]
                        }
                    },
                    draftCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "draft"] }, 1, 0],
                        },
                    },
                    sentCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "sent"] }, 1, 0],
                        },
                    },
                    paidCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "paid"] }, 1, 0],
                        },
                    },
                },
            },

        ]);

        res.status(200).json(stats[0] || {});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//==============Create Soft deleted =================
exports.deleteInvoice = async (req, res) => {
    try{
        if(req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const invoice = await Invoice.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
                isDeleted: false,
            },
            { isDeleted: true },
            { new: true }
        );
        if(!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        res.status(200).json({ message: "Invoice deleted successfully" });
    } catch(error) {
        res.status(500).json({ message: error.message})
    }
}