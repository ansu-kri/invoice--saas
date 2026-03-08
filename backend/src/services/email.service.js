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
      //  Generate PDF in memory
      const doc = new PDFDocument();
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", async () => {
        const pdfData = Buffer.concat(buffers);

        //  Send email
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // your 16-char App Password
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: invoice.clientEmail,
          subject: `Invoice #${invoice.invoiceNumber}`,
          html: `
            <h2>Invoice #${invoice.invoiceNumber}</h2>
            <p>Amount: ₹${invoice.totalAmount}</p>
            <p>Status: ${invoice.status}</p>
            <p>Please find the attached invoice PDF.</p>
          `,
          attachments: [
            {
              filename: `Invoice-${invoice.invoiceNumber}.pdf`,
              content: pdfData,
              contentType: "application/pdf",
            },
          ],
        });

        resolve();
      });

      //  PDF content
      doc.fontSize(20).text(`Invoice #${invoice.invoiceNumber}`, { align: "center" });
      doc.moveDown();
      doc.fontSize(14).text(`Client: ${invoice.clientName}`);
      doc.text(`Email: ${invoice.clientEmail}`);
      doc.text(`Amount: ₹${invoice.totalAmount}`);
      doc.text(`Status: ${invoice.status}`);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};