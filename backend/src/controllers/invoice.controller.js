const Invoice = require("../models/Invoice");
const { validationResult } = require("express-validator")
const PDFDocument = require("pdfkit")
const razorpay = require("../config/razorpay");
const {sendInvoiceEmail} = require("../services/email.service");


//==============CreateInvoice======================
exports.createInvoice = async (req, res) => {
    try {
        const { clientName, clientEmail, items } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
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
    const invoice = await Invoice.findOne({
        _id: req.params.id,
        organizationId: req.user.organizationId,
    });

    if(!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
    }
    const options = {
        amount: invoice.totalAmount * 100, //paise
        currency: "INR",
        receipt: invoice._id.toString(),
    }
    const order = await razorpay.orders.create(options);

    res.json(order)
}

//=======Verify Payment API==============
exports.verifyPayment = async (req,res)=>{
  try{

    const {invoiceId} = req.body;

    await Invoice.findByIdAndUpdate(invoiceId,{
      status:"paid"
    });

    res.json({
      message:"Payment verified",
      status:"paid"
    });

  }catch(err){
    res.status(500).json({
      message:"Payment verification failed"
    })
  }
}


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
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    await sendInvoiceEmailWithPDF(invoice);

    res.json({ message: "Invoice PDF sent to client successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send invoice email" });
  }
};