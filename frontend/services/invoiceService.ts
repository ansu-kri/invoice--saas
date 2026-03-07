import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const handlePayment = async (invoice: any) => {
  try {
    // 1 Create Razorpay order from backend
    const { data } = await axios.post(
      `${API_URL}/invoices/${invoice._id}/create-order`
    );

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: data.amount,
      currency: data.currency,
      order_id: data.id,

      handler: async function (response:any) {
        // 2 Verify payment
        await axios.post(`${API_URL}/api/invoices/verify-payment`, {
          invoiceId: invoice._id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });

        alert("Payment Successful");
      },

      prefill: {
        name: invoice.clientName,
        email: invoice.clientEmail,
      },

      theme: {
        color: "#6366F1",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error("Payment failed", error);
  }
};