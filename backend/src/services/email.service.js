const { createInvoicePdf } = require("./invoice-pdf.service");
const { Resend } = require("resend");

const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]);

const sendInvoiceEmail = async (invoice) => {
    if (!invoice.clientEmail) {
        throw new Error("The invoice does not have a client email address.");
    }
    if (!process.env.RESEND_API_KEY) {
        const error = new Error("Email delivery is not configured. Set RESEND_API_KEY.");
        error.statusCode = 503;
        throw error;
    }
    if (!process.env.RESEND_FROM_EMAIL) {
        const error = new Error("Email sender is not configured. Set RESEND_FROM_EMAIL to an address on a verified Resend domain.");
        error.statusCode = 503;
        throw error;
    }

    const invoiceId = invoice._id.toString().slice(-6).toUpperCase();
    const pdf = await createInvoicePdf(invoice);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
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
        const providerError = new Error(error.message || "Email provider rejected the invoice.");
        const upstreamStatus = Number(error.statusCode || error.status);
        providerError.statusCode = upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 502;
        throw providerError;
    }
};

module.exports = { sendInvoiceEmail };

