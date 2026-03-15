const cron = require("node-cron");
const Invoice = require("../models/Invoice");
const { sendInvoiceEmail } = require("../services/email.service");

cron.schedule("* * *", async () => {
    try {
        const today = new Date();

        const invoices = await Invoice.find({
            status: { $in: ["Pending", "Overdue"] },
            dueDate: { $lt: today }
        });

        for (let invoice of invoices) {

            if (invoice.status === "Pending") {
                invoice.status = "Overdue";
            }
            const lastsent = invoice.lastReminderSent;
            if (!lastsent || lastsent.toDateString() !== today.toDateString()) {
                await sendInvoiceEmail(invoice);
                invoice.lastReminderSent = today;
            }


            await invoice.save();
        }
        console.log(`${invoices.length} reminder emails sent and statues updated`);
    } catch (error) {
        console.error("corn job error:", error)
    }
});