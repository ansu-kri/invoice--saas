const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_kEY_ID,
    key_secret: process.env.RAZORPAY_kEY_SECRET,
})

module.exports = razorpay;