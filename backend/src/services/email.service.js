// ================= Invoice Email with PDF =================

const PDFDocument = require("pdfkit");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendInvoiceEmail = async (invoice) => {
  try {
    const doc = new PDFDocument();
    const buffers = [];

    // Collect PDF data
    doc.on("data",buffers.push.bind(buffers));

    doc.on("end", async () => {
      try {
        const pdfData = Buffer.concat(buffers);
        const invoiceId = invoice._id.toString().slice(-6);

        await resend.emails.send({
          from: "Invoice SaaS <onboarding@resend.dev>",
          to: "ansusharma1952@gmail.com",
          subject: `Invoice #${invoiceId}`,
          html: `
            <h2>Invoice #${invoiceId}</h2>
            <p><strong>Client:</strong> ${invoice.clientName}</p>
            <p><strong>Amount:</strong> ₹${invoice.totalAmount}</p>
            <p><strong>Status:</strong> ${invoice.status}</p>
            <p>Please find the attached invoice PDF.</p>
          `,
          attachments: [
            {
              filename: `Invoice-${invoiceId}.pdf`,
              content: pdfData.toString("base64"),
              encoding: "base64",
            },
          ],
        });

        console.log("Invoice email sent successfully");
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }
    });

    // ===== Generate Invoice PDF =====

    const invoiceId = invoice._id.toString().slice(-6);

    doc.fontSize(26).fillColor("#333").text("INVOICE", { align: "center" });

    doc.moveDown();

    doc.fontSize(12)
      .fillColor("#555")
      .text(`Invoice ID: ${invoiceId}`)
      .text(`Date: ${new Date().toLocaleDateString()}`);

    doc.moveDown();

    doc.fontSize(16).fillColor("#000").text("Bill To:");
    doc.fontSize(12)
      .text(invoice.clientName)
      .text(invoice.clientEmail);

    doc.moveDown();

    doc.fontSize(16).text("Invoice Details");
    doc.moveDown(0.5);

    doc.fontSize(12)
      .text(`Amount: ₹${invoice.totalAmount}`)
      .text(`Status: ${invoice.status}`);

    doc.moveDown(2);

    doc.fontSize(10)
      .fillColor("gray")
      .text("Thank you for your business!", { align: "center" });

    doc.end();

  } catch (error) {
    console.error("Invoice email error:", error);
  }
};

module.exports = { sendInvoiceEmail };