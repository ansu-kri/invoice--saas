const Invoice = require("../models/Invoice");
const { validationResult } = require("express-validator")
const PDFDocument = require("pdfkit")
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const {sendInvoiceEmail} = require("../services/email.service");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const { createOrganizationNotification } = require("../services/notification.service");


//==============CreateInvoice======================
exports.createInvoice = async (req, res) => {
    try {
        const { clientName, clientEmail, items, dueDate: requestedDueDate } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!Array.isArray(items) || items.length === 0 || items.some((item) =>
            !item.description ||
            !Number.isFinite(Number(item.quantity)) ||
            Number(item.quantity) <= 0 ||
            !Number.isFinite(Number(item.price)) ||
            Number(item.price) < 0
        )) {
            return res.status(400).json({ message: "Invoice items must have a description, positive quantity, and valid price" });
        }
        const totalAmount = items.reduce((acc, item) => acc + Number(item.quantity) * Number(item.price), 0);

        const dueDate = requestedDueDate ? new Date(requestedDueDate) : new Date();
        if (Number.isNaN(dueDate.getTime())) {
            return res.status(400).json({ message: "Invalid invoice due date" });
        }
        if (!requestedDueDate) dueDate.setDate(dueDate.getDate() + 1);

        const normalizedEmail = clientEmail ? String(clientEmail).trim().toLowerCase() : "";
        const existingCustomer = await Customer.findOne({
            organizationId: req.user.organizationId,
            isDeleted: false,
            ...(normalizedEmail
                ? { email: normalizedEmail }
                : { name: { $regex: `^${String(clientName).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }),
        });
        const customer = existingCustomer || await Customer.create({
            organizationId: req.user.organizationId,
            name: String(clientName).trim(),
            email: normalizedEmail || undefined,
        });

        //creating the invoice
        const invoice = await Invoice.create({
            //we do not take organizationId from body, we take req.user.organizationId ,,,because this prevent tenant data leakage.

            organizationId: req.user.organizationId,
            createdBy: req.user._id,
            customerId: customer._id,
            clientName: customer.name,
            clientEmail: normalizedEmail || customer.email,
            items,
            totalAmount,
            dueDate,
        })
        await createOrganizationNotification({
            organizationId: req.user.organizationId,
            type: "invoice",
            title: "Invoice created",
            message: `Invoice for ${invoice.clientName} was created.`,
            href: `/invoices/${invoice._id}`,
        });
        res.status(201).json(invoice)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//=====================Get AllInvoice (pagination and search by client name)=====================
exports.getInvoice = async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
        const search = String(req.query.search || "").trim();
        const skip = (page - 1) * limit;
        const query = {
            organizationId: req.user.organizationId,
            isDeleted: false,
        };
        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            query.clientName = { $regex: escapedSearch, $options: "i" };
        }
        if (req.query.status) {
            const status = String(req.query.status).toLowerCase();
            if (!["draft", "pending", "sent", "paid", "overdue"].includes(status)) {
                return res.status(400).json({ message: "Invalid invoice status filter" });
            }
            if (status === "overdue") {
                query.$and = [{
                    $or: [
                        { status: { $regex: "^overdue$", $options: "i" } },
                        {
                            status: { $in: ["Pending", "Sent", "pending", "sent"] },
                            dueDate: { $lt: new Date() },
                        },
                    ],
                }];
            } else if (status === "pending" || status === "sent") {
                query.$and = [
                    { status: { $regex: `^${status}$`, $options: "i" } },
                    { dueDate: { $gte: new Date() } },
                ];
            } else {
                query.status = { $regex: `^${status}$`, $options: "i" };
            }
        }
        if (req.query.from || req.query.to) {
            const start = req.query.from ? new Date(req.query.from) : null;
            const end = req.query.to ? new Date(req.query.to) : null;
            if (
                (start && Number.isNaN(start.getTime())) ||
                (end && Number.isNaN(end.getTime())) ||
                (start && end && start > end)
            ) {
                return res.status(400).json({ message: "Invalid invoice date range" });
            }
            query.createdAt = {};
            if (start) query.createdAt.$gte = start;
            if (end) {
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }
        const sortField = ["createdAt", "dueDate", "totalAmount", "clientName"].includes(req.query.sort)
            ? req.query.sort
            : "createdAt";
        const sortDirection = req.query.direction === "asc" ? 1 : -1;
        const total = await Invoice.countDocuments(query);

        const invoices = await Invoice.find(query)
            .sort({ [sortField]: sortDirection })
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

exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
            isDeleted: false,
        }).lean();
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });
        res.status(200).json(invoice);
    } catch (error) {
        res.status(400).json({ message: "Invalid invoice ID" });
    }
};

exports.updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
            isDeleted: false,
        });
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });
        if (String(invoice.status).toLowerCase() === "paid") {
            return res.status(409).json({ message: "Paid invoices cannot be edited" });
        }

        const { clientName, clientEmail, items, dueDate } = req.body;
        if (clientName !== undefined) {
            if (!String(clientName).trim()) return res.status(400).json({ message: "Customer name is required" });
            invoice.clientName = String(clientName).trim();
        }
        if (clientEmail !== undefined) {
            const email = String(clientEmail).trim().toLowerCase();
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ message: "Customer email is invalid" });
            }
            invoice.clientEmail = email || undefined;
        }
        if (items !== undefined) {
            if (!Array.isArray(items) || items.length === 0 || items.some((item) =>
                !item.description ||
                !Number.isFinite(Number(item.quantity)) ||
                Number(item.quantity) <= 0 ||
                !Number.isFinite(Number(item.price)) ||
                Number(item.price) < 0
            )) {
                return res.status(400).json({ message: "Invoice items are invalid" });
            }
            invoice.items = items;
            invoice.totalAmount = items.reduce(
                (total, item) => total + Number(item.quantity) * Number(item.price),
                0,
            );
        }
        if (dueDate !== undefined) {
            const parsedDueDate = new Date(dueDate);
            if (Number.isNaN(parsedDueDate.getTime())) {
                return res.status(400).json({ message: "Invalid invoice due date" });
            }
            invoice.dueDate = parsedDueDate;
        }

        const email = invoice.clientEmail ? invoice.clientEmail.toLowerCase() : "";
        let customer = await Customer.findOne({
            organizationId: req.user.organizationId,
            isDeleted: false,
            ...(email
                ? { email }
                : { name: { $regex: `^${invoice.clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }),
        });
        if (!customer) {
            customer = await Customer.create({
                organizationId: req.user.organizationId,
                name: invoice.clientName,
                email: email || undefined,
            });
        }
        invoice.customerId = customer._id;
        await invoice.save();
        res.status(200).json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//=====================Update status invoice===========
exports.updateInvoiceStatus = async (req, res) => {
    try {
        const status = String(req.body.status || "").toLowerCase();
        const allowedStatuses = ["draft", "pending", "sent", "paid", "overdue"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid invoice status" });
        }

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
            {
                status: status.charAt(0).toUpperCase() + status.slice(1),
                ...(status === "paid" ? { paidAt: new Date() } : { paidAt: null }),
            },
            { new: true, runValidators: true }
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
                return res.status(400).json({ message: "Invalid dashboard date range" });
            }
            match.createdAt = {};
            if (start) match.createdAt.$gte = start;
            if (end) {
                end.setHours(23, 59, 59, 999);
                match.createdAt.$lte = end;
            }
        }

        const normalizedStatus = { $toLower: { $ifNull: ["$status", "pending"] } };
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const [summary, trend, recentInvoices, paymentAlerts] = await Promise.all([
            Invoice.aggregate([
                { $match: match },
                {
                    $addFields: {
                        normalizedStatus,
                        dashboardStatus: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: [normalizedStatus, "paid"] },
                                        { $lt: ["$dueDate", now] },
                                    ],
                                },
                                "overdue",
                                normalizedStatus,
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$totalAmount" },
                        paidRevenue: {
                            $sum: { $cond: [{ $eq: ["$normalizedStatus", "paid"] }, "$totalAmount", 0] },
                        },
                        outstandingAmount: {
                            $sum: { $cond: [{ $ne: ["$normalizedStatus", "paid"] }, "$totalAmount", 0] },
                        },
                        totalInvoices: { $sum: 1 },
                        paidCount: { $sum: { $cond: [{ $eq: ["$normalizedStatus", "paid"] }, 1, 0] } },
                        pendingCount: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "pending"] }, 1, 0] } },
                        draftCount: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "draft"] }, 1, 0] } },
                        sentCount: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "sent"] }, 1, 0] } },
                        overdueCount: { $sum: { $cond: [{ $eq: ["$dashboardStatus", "overdue"] }, 1, 0] } },
                    },
                },
                { $project: { _id: 0 } },
            ]),
            Invoice.aggregate([
                { $match: match },
                {
                    $addFields: {
                        normalizedStatus,
                        revenueDate: { $ifNull: ["$paidAt", "$createdAt"] },
                    },
                },
                { $match: { normalizedStatus: "paid" } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: from && to && new Date(to) - new Date(from) <= 31 * 86400000
                                    ? "%Y-%m-%d"
                                    : "%Y-%m",
                                date: "$revenueDate",
                            },
                        },
                        amount: { $sum: "$totalAmount" },
                    },
                },
                { $sort: { _id: 1 } },
                { $project: { _id: 0, date: "$_id", amount: 1 } },
            ]),
            Invoice.find(match).sort({ createdAt: -1 }).limit(6).lean(),
            Invoice.aggregate([
                {
                    $match: {
                        organizationId: req.user.organizationId,
                        isDeleted: false,
                    },
                },
                { $addFields: { normalizedStatus } },
                {
                    $facet: {
                        upcomingInvoices: [
                            {
                                $match: {
                                    normalizedStatus: { $ne: "paid" },
                                    dueDate: { $gte: now, $lte: nextWeek },
                                },
                            },
                            { $sort: { dueDate: 1 } },
                            { $limit: 5 },
                            { $project: { clientName: 1, totalAmount: 1, status: 1, dueDate: 1 } },
                        ],
                        overdue: [
                            {
                                $match: {
                                    normalizedStatus: { $ne: "paid" },
                                    dueDate: { $lt: now },
                                },
                            },
                            { $count: "count" },
                        ],
                    },
                },
            ]),
        ]);

        res.status(200).json({
            ...(summary[0] || {
                totalRevenue: 0,
                paidRevenue: 0,
                outstandingAmount: 0,
                totalInvoices: 0,
                paidCount: 0,
                pendingCount: 0,
                draftCount: 0,
                sentCount: 0,
                overdueCount: 0,
            }),
            revenueTrend: trend,
            recentInvoices,
            paymentAlerts: {
                upcomingInvoices: paymentAlerts[0]?.upcomingInvoices || [],
                overdueCount: paymentAlerts[0]?.overdue?.[0]?.count || 0,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//==============Create Soft deleted =================
exports.deleteInvoice = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
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
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        res.status(200).json({ message: "Invoice deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

//===== Create pdf invoice=================
exports.downloadInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
            isDeleted: false,
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" })
        }

        const doc = new PDFDocument();

        res.setHeader("content-Type", "application/pdf");
        res.setHeader(
            "content-Disposition",
            `attachment; filename=invoice-${invoice._id}.pdf`
        );

        doc.pipe(res);

        doc.fontSize(20).text("Invoice", { align: "center" });
        doc.moveDown();

        doc.fontSize(14).text(`Client: ${invoice.clientName}`);
        doc.text(`Email: ${invoice.clientEmail}`);
        doc.text(`Status: ${invoice.status}`);
        doc.moveDown();

        invoice.items.forEach((item, index) => {
            doc.text(
                `${index + 1}. ${item.description} - ${item.quantity} x ${item.price}`
            );
        });

        doc.moveDown();
        doc.fontSize(16).text(`Total: ₹ ${invoice.totalAmount}`);

        doc.end();

    } catch (error) { 
        res.status(500).json({ message: "PDF generation failed" })
    }
}

//========== Create Order API===================

exports.createPaymentOrder = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
            isDeleted: false,
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        if (String(invoice.status).toLowerCase() === "paid") {
            return res.status(409).json({ message: "This invoice has already been paid" });
        }
        if (!Number.isFinite(invoice.totalAmount) || invoice.totalAmount <= 0) {
            return res.status(400).json({ message: "Invoice amount must be greater than zero" });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(invoice.totalAmount * 100),
            currency: "INR",
            receipt: invoice._id.toString(),
        });
        invoice.razorpayOrderId = order.id;
        await invoice.save();
        res.json(order);
    } catch (error) {
        res.status(502).json({ message: "Could not create a payment order" });
    }
}

//=======Verify Payment API==============
exports.verifyPayment = async (req,res)=>{
    try {
        const {
            invoiceId,
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            razorpay_signature: signature,
        } = req.body;
        if (!invoiceId || !paymentId || !orderId || !signature) {
            return res.status(400).json({ message: "Payment verification details are required" });
        }

        const invoice = await Invoice.findOne({
            _id: invoiceId,
            organizationId: req.user.organizationId,
            isDeleted: false,
            razorpayOrderId: orderId,
        });
        if (!invoice) {
            return res.status(404).json({ message: "Invoice or payment order not found" });
        }

        const existingPayment = await Payment.findOne({
            providerPaymentId: paymentId,
        });
        if (existingPayment) {
            if (
                String(existingPayment.organizationId) !== String(req.user.organizationId) ||
                String(existingPayment.invoiceId) !== String(invoice._id) ||
                existingPayment.providerOrderId !== orderId
            ) {
                return res.status(409).json({ message: "Payment is already associated with another transaction" });
            }
            invoice.status = "Paid";
            invoice.paidAt = existingPayment.paidAt;
            await invoice.save();
            return res.status(200).json({ message: "Payment already verified", status: "Paid" });
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({ message: "Payment verification is not configured" });
        }
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest();
        const receivedSignature = Buffer.from(signature, "hex");
        if (
            expectedSignature.length !== receivedSignature.length ||
            !crypto.timingSafeEqual(expectedSignature, receivedSignature)
        ) {
            return res.status(400).json({ message: "Payment signature is invalid" });
        }

        const providerPayment = await razorpay.payments.fetch(paymentId);
        if (
            providerPayment.order_id !== orderId ||
            providerPayment.amount !== Math.round(invoice.totalAmount * 100) ||
            providerPayment.currency !== "INR" ||
            providerPayment.status !== "captured"
        ) {
            return res.status(409).json({ message: "Payment has not been captured for this invoice" });
        }

        const paidAt = providerPayment.created_at
            ? new Date(providerPayment.created_at * 1000)
            : new Date();
        await Payment.create({
            organizationId: req.user.organizationId,
            invoiceId: invoice._id,
            provider: "razorpay",
            providerOrderId: orderId,
            providerPaymentId: paymentId,
            amount: providerPayment.amount / 100,
            currency: providerPayment.currency,
            status: "captured",
            paidAt,
        });
        invoice.status = "Paid";
        invoice.paidAt = paidAt;
        await invoice.save();
        await createOrganizationNotification({
            organizationId: req.user.organizationId,
            type: "payment",
            title: "Payment received",
            message: `A payment of INR ${providerPayment.amount / 100} was received for ${invoice.clientName}.`,
            href: `/invoices/${invoice._id}`,
        });

        res.json({ message: "Payment verified", status: "Paid" });
    } catch (error) {
        if (error.code === 11000) {
            const duplicate = await Payment.findOne({
                providerPaymentId: error.keyValue?.providerPaymentId,
            });
            if (
                duplicate &&
                String(duplicate.organizationId) === String(req.user.organizationId) &&
                String(duplicate.invoiceId) === String(req.body.invoiceId)
            ) {
                await Invoice.updateOne(
                    {
                        _id: duplicate.invoiceId,
                        organizationId: req.user.organizationId,
                        isDeleted: false,
                    },
                    { $set: { status: "Paid", paidAt: duplicate.paidAt } },
                );
                return res.status(200).json({ message: "Payment already verified", status: "Paid" });
            }
            return res.status(409).json({ message: "Payment is already associated with another transaction" });
        }
        console.error("Payment verification failed:", error.message);
        res.status(502).json({ message: "Payment verification failed" });
    }
};


//================Send Invoice Email==========

// exports.sendInvoiceToClient = async (req, res) => {
//   try {
//     const { invoiceId } = req.params;

//     // Fetch the invoice
//     const invoice = await Invoice.findById(invoiceId);
//     if (!invoice) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }

//     // Prepare email HTML
//     const invoiceHTML = `
//       <h2>Invoice #${invoice.invoiceNumber}</h2>
//       <p>Amount: ₹${invoice.totalAmount}</p>
//       <p>Status: ${invoice.status}</p>
//     `;

//     // Send email
//     await sendInvoiceEmail(invoice.clientEmail, `Your Invoice #${invoice.invoiceNumber}`, invoiceHTML);

//     res.json({ message: "Invoice sent to the client successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to send invoice email" });
//   }
// };


//==== invoice with PDF=========
exports.sendInvoiceToClient = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      organizationId: req.user.organizationId,
      isDeleted: false,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    if (!invoice.clientEmail) {
      return res.status(400).json({ message: "This invoice has no client email address" });
    }

    await sendInvoiceEmail(invoice);
    if (String(invoice.status).toLowerCase() === "pending") {
      invoice.status = "Sent";
      await invoice.save();
    }

    res.json({
      success: true,
      message: "Invoice PDF sent to client successfully",
    });

  } catch (err) {
    console.error("Send invoice error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to send invoice email",
    });
  }
};

//=============automatic send email==========
exports.reminderService = async (req, res) => {
  try {
    const today = new Date();

    const invoices = await Invoice.find({
      organizationId: req.user.organizationId,
      isDeleted: false,
      status: { $in: ["Pending", "Overdue"] },
      dueDate: { $lte: today },
      clientEmail: { $exists: true, $ne: "" },
    });

    if (!invoices.length) {
      return res.json({ message: "No eligible overdue invoices", total: 0 });
    }

    let sent = 0;
    for (let invoice of invoices) {
      const lastSent = invoice.lastReminderSent;
      if (!lastSent || lastSent.toDateString() !== today.toDateString()) {
        await sendInvoiceEmail(invoice);
        invoice.lastReminderSent = today;
        sent += 1;
      }

      if (invoice.status === "Pending") {
        invoice.status = "Overdue";
      }

      await invoice.save();
    }

    res.json({
      message: "Reminder emails sent successfully",
      total: sent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};