const PDFDocument = require("pdfkit");
const { Resend } = require("resend");

const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]);

const createInvoicePdf = (invoice) => new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).fillColor("#28324a").text("INVOICE", { align: "center" });
    doc.moveDown();
    doc.fontSize(11).fillColor("#4b5568")
        .text(`Invoice: ${invoice._id.toString().slice(-6).toUpperCase()}`)
        .text(`Issued: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}`)
        .text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    doc.moveDown();
    doc.fontSize(14).fillColor("#222").text("Bill to");
    doc.fontSize(11).text(invoice.clientName);
    if (invoice.clientEmail) doc.text(invoice.clientEmail);
    doc.moveDown();
    invoice.items.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.description} - ${item.quantity} x INR ${item.price}`);
    });
    doc.moveDown();
    doc.fontSize(15).fillColor("#222").text(`Total: ₹${invoice.totalAmount}`);
    doc.fontSize(11).text(`Status: ${invoice.status}`);
    doc.end();
});

const sendInvoiceEmail = async (invoice) => {
    if (!invoice.clientEmail) {
        throw new Error("The invoice does not have a client email address.");
    }
    if (!process.env.RESEND_API_KEY) {
        throw new Error("Email delivery is not configured.");
    }

    const invoiceId = invoice._id.toString().slice(-6).toUpperCase();
    const pdf = await createInvoicePdf(invoice);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Invoice SaaS <onboarding@resend.dev>",
        to: invoice.clientEmail,
        subject: `Invoice ${invoiceId}`,
        html: `
            <h2>Invoice ${escapeHtml(invoiceId)}</h2>
            <p><strong>Client:</strong> ${escapeHtml(invoice.clientName)}</p>
            <p><strong>Amount:</strong> INR ${escapeHtml(invoice.totalAmount)}</p>
            <p><strong>Status:</strong> ${escapeHtml(invoice.status)}</p>
            <p>Please find your invoice attached.</p>
        `,
        attachments: [{
            filename: `Invoice-${invoiceId}.pdf`,
            content: pdf.toString("base64"),
        }],
    });
    if (error) {
        throw new Error(error.message || "Email provider rejected the invoice.");
    }
};

module.exports = { sendInvoiceEmail };
