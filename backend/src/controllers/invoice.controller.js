const Invoice = require("../models/Invoice");


//==============CreateInvoice======================
exports.createInvoice = async (req, res) => {
    try{
        const { clientName, clientEmail, items} = req.body;

        const totalAmount = items.reduce((acc,item) => acc + item.quantity * item.price, 0);

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
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
}

//=====================Get AllInvoice=====================
exports.getInvoice = async ( req, res) => {
    try{
        const invoices = await Invoice.find({
            organizationId: req.user.organizationId,
        }).sort({ createdAt: -1});

        res.status(200).json(invoices);
    } catch(error){
        res.status(500).json({ message: error.message });
    }
}
//we are filtering = organizationId: req.user.organizationId