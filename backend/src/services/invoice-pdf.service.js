const PDFDocument = require("pdfkit");

const NAVY = "#17365D";
const INK = "#1F2D40";
const MUTED = "#6B7A8D";
const LINE = "#E3E8EE";
const PALE = "#F3F6F9";
const PAGE = { width: 595.28, height: 841.89, margin: 48 };
const currencySymbol = process.env.INVOICE_CURRENCY_SYMBOL || "";

const amount = (value) => `${currencySymbol}${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
}).format(Number(value) || 0)}`;
const dateValue = (value) => value ? new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
}) : "[Add date]";
const text = (doc, value, x, y, width, options = {}) => doc.text(String(value), x, y, {
    width, lineBreak: false, continued: false, ...options,
});
const label = (doc, value, x, y, width) => {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED);
    text(doc, value.toUpperCase(), x, y, width, { characterSpacing: 0.7 });
};

const createInvoicePdf = (invoice) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: PAGE.margin, bufferPages: true });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = PAGE.margin;
    const right = PAGE.width - PAGE.margin;
    const width = right - left;
    doc.rect(0, 0, PAGE.width, 8).fill(NAVY);

    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED);
    text(doc, "INVOICE STATEMENT", left, 44, 220, { characterSpacing: 1.2 });
    doc.font("Helvetica-Bold").fontSize(29).fillColor(NAVY);
    text(doc, "INVOICE", 365, 39, 180, { align: "right", characterSpacing: 1 });

    const status = String(invoice.status || "Pending").toUpperCase();
    const badgeWidth = Math.max(76, doc.widthOfString(status, { font: "Helvetica-Bold", size: 8 }) + 22);
    doc.roundedRect(right - badgeWidth, 82, badgeWidth, 23, 11).fill("#FFF2D7");
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#875900");
    text(doc, status, right - badgeWidth, 90, badgeWidth, { align: "center", characterSpacing: 0.8 });

    const id = invoice.invoiceNumber || (invoice._id && invoice._id.toString
        ? invoice._id.toString().slice(-6).toUpperCase() : "[Invoice number]");
    const metaY = 123;
    const meta = [
        ["Invoice number", id],
        ["Invoice date", dateValue(invoice.createdAt)],
        ["Due date", dateValue(invoice.dueDate)],
    ];
    meta.forEach(([name, value], index) => {
        const x = left + index * 170;
        label(doc, name, x, metaY, 160);
        doc.font("Helvetica-Bold").fontSize(10).fillColor(INK);
        text(doc, value, x, metaY + 15, 160);
    });

    doc.moveTo(left, 164).lineTo(right, 164).lineWidth(1).strokeColor(LINE).stroke();
    label(doc, "Bill to", left, 184, 220);
    doc.font("Helvetica-Bold").fontSize(15).fillColor(INK);
    text(doc, invoice.clientName || "[Client name]", left, 201, 235);
    doc.font("Helvetica").fontSize(10).fillColor(MUTED);
    text(doc, invoice.clientEmail || "[Client email]", left, 222, 235);
    label(doc, "Billing information", 330, 184, 215);
    doc.font("Helvetica").fontSize(10).fillColor(MUTED);
    const billingAddress = String(invoice.billingAddress || "[Billing address]");
    const billingAddressOptions = { width: 215, lineGap: 2 };
    const billingAddressHeight = doc.heightOfString(billingAddress, billingAddressOptions);
    text(doc, billingAddress, 330, 201, 215, {
        lineBreak: true,
        lineGap: 2,
        height: billingAddressHeight,
    });

    // Position the invoice table below the measured address block so wrapping
    // never triggers PDFKit's automatic page creation.
    const tableY = Math.max(270, 201 + billingAddressHeight + 20);
    const cols = { description: left + 10, quantity: 355, unit: 440, total: right - 10 };

    const footerY = PAGE.height - PAGE.margin - 26;
    const summaryX = right - 220;
    const renderFooter = () => {
        doc.moveTo(left, footerY).lineTo(right, footerY).lineWidth(0.8).strokeColor(LINE).stroke();
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#45566D");
        text(doc, "Thank you for your business.", left, footerY + 14, 225);
        doc.font("Helvetica").fontSize(8).fillColor(MUTED);
        text(doc, "We appreciate your continued partnership.", right - 230, footerY + 14, 230, { align: "right" });
    };
    const drawTableHeader = (y) => {
        doc.roundedRect(left, y, width, 33, 4).fill(NAVY);
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#FFFFFF");
        text(doc, "DESCRIPTION", cols.description, y + 12, 210, { characterSpacing: 0.6 });
        text(doc, "QUANTITY", 310, y + 12, 68, { align: "right", characterSpacing: 0.4 });
        text(doc, "UNIT PRICE", 385, y + 12, 75, { align: "right", characterSpacing: 0.4 });
        text(doc, "AMOUNT", 462, y + 12, 75, { align: "right", characterSpacing: 0.4 });
    };
    const newContentPage = (withTableHeader = true) => {
        renderFooter();
        doc.addPage({ size: "A4", margin: PAGE.margin });
        if (withTableHeader) drawTableHeader(PAGE.margin);
        return PAGE.margin + (withTableHeader ? 33 : 0);
    };

    let rowY = tableY + 33;
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    // If an unusually tall address pushes the table beyond the useful first-page
    // area, begin the table on a fresh page rather than colliding with the footer.
    if (rowY > footerY - 190) rowY = newContentPage();
    else drawTableHeader(tableY);
    const renderItem = (item) => {
        const description = String(item.description || "Service");
        doc.font("Helvetica-Bold").fontSize(10);
        const descriptionHeight = doc.heightOfString(description, { width: 220, lineGap: 2 });
        const rowHeight = Math.max(42, descriptionHeight + 24);
        if (rowY + rowHeight > footerY - 190) rowY = newContentPage();
        doc.font("Helvetica-Bold").fontSize(10).fillColor(INK);
        text(doc, description, cols.description, rowY + 12, 220, {
            lineBreak: true,
            lineGap: 2,
            height: rowHeight - 20,
        });
        doc.font("Helvetica").fontSize(10).fillColor(INK);
        text(doc, item.quantity, 310, rowY + 14, 68, { align: "right" });
        text(doc, amount(item.price), 385, rowY + 14, 75, { align: "right" });
        text(doc, amount(Number(item.quantity) * Number(item.price)), 462, rowY + 14, 75, { align: "right" });
        rowY += rowHeight;
        doc.moveTo(left, rowY).lineTo(right, rowY).lineWidth(0.7).strokeColor(LINE).stroke();
    };
    if (items.length) items.forEach(renderItem);
    else {
        doc.font("Helvetica").fontSize(10).fillColor(MUTED);
        text(doc, "[Add invoice items]", cols.description, rowY + 14, 300);
        rowY += 42;
        doc.moveTo(left, rowY).lineTo(right, rowY).lineWidth(0.7).strokeColor(LINE).stroke();
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0);
    const total = Number.isFinite(Number(invoice.totalAmount)) ? Number(invoice.totalAmount) : subtotal;
    let summaryY = rowY + 18;
    if (summaryY + 161 > footerY) {
        rowY = newContentPage(false);
        summaryY = rowY;
    }
    doc.font("Helvetica").fontSize(10).fillColor(MUTED);
    text(doc, "Subtotal", summaryX, summaryY, 100);
    doc.font("Helvetica-Bold").fillColor(INK);
    text(doc, amount(subtotal), summaryX + 105, summaryY, 115, { align: "right" });
    doc.roundedRect(summaryX, summaryY + 24, 220, 54, 5).fill(PALE);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(NAVY);
    text(doc, "GRAND TOTAL", summaryX + 14, summaryY + 44, 100, { characterSpacing: 0.5 });
    doc.font("Helvetica-Bold").fontSize(17).fillColor(NAVY);
    text(doc, amount(total), summaryX + 110, summaryY + 40, 96, { align: "right" });

    const payY = summaryY + 103;
    doc.roundedRect(left, payY, width, 58, 4).fill("#F7F9FB");
    doc.rect(left, payY, 3, 58).fill("#7390AE");
    label(doc, "Payment instructions", left + 15, payY + 12, width - 30);
    doc.font("Helvetica").fontSize(9).fillColor(MUTED);
    text(doc, invoice.paymentInstructions || "[Add payment instructions]", left + 15, payY + 29, width - 30);

    renderFooter();
    doc.end();
});

module.exports = { createInvoicePdf };

