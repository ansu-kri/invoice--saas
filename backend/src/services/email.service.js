// const nodemailer = require("nodemailer");

// exports.sendInvoiceEmail = async (to, subject, html) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS, // 16-char App Password
//     },
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject,
//     html, // HTML for invoices
//   });
// };


//==============invoice with PDF==========================
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

exports.sendInvoiceEmail = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", async () => {
        try {
          const pdfData = Buffer.concat(buffers);

          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: invoice.clientEmail,
            subject: `Invoice #${invoice._id.toString().slice(-6)}`,
            html: `
              <h2>Invoice #${invoice._id.toString().slice(-6)}</h2>
              <p>Amount: ₹${invoice.totalAmount}</p>
              <p>Status: ${invoice.status}</p>
              <p>Please find the attached invoice PDF.</p>
            `,
            attachments: [
              {
                filename: `Invoice-${invoice._id.toString().slice(-6)}.pdf`,
                content: pdfData,
                contentType: "application/pdf",
              },
            ],
          });

          resolve();
        } catch (error) {
          console.error("Email sending error:", error);
          reject(error);
        }
      });

      const invoiceId = invoice._id.toString().slice(-6);

      doc.fontSize(26).fillColor("#333").text("INVOICE", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).fillColor("#555").text(`Invoice ID: ${invoiceId}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown();
      doc.fontSize(16).fillColor("#000").text("Bill To:");
      doc.fontSize(12).text(invoice.clientName);
      doc.text(invoice.clientEmail);
      doc.moveDown();
      doc.fontSize(16).text("Invoice Details");
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Amount: ₹${invoice.totalAmount}`)
        .text(`Status: ${invoice.status}`);
      doc.moveDown(2);
      doc.fontSize(10).fillColor("gray").text(
        "Thank you for your business!",
        { align: "center" }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};