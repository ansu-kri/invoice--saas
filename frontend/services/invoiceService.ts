import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const handlePayment = async (invoice: any) => {
    try {
        const token = localStorage.getItem("token");
        //  Create Razorpay order from backend
        const { data } = await axios.post(
            `${API_URL}/api/invoices/${invoice._id}/create-order`, {},
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
            amount: data.amount,
            currency: data.currency,
            order_id: data.id,

            name: "Your Company",
            description: `Invoice Payment - ${invoice.invoiceNumber}`,

            handler: async function (response: any) {
                // Verify payment
                await axios.post(`${API_URL}/api/invoices/verify-payment`, {
                    invoiceId: invoice._id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    }
                );

                alert("Payment Successful");
            },

            prefill: {
                name: invoice.clientName || "Customer",
                email: invoice.clientEmail || "customer@email.com",
                contact: invoice.clientPhone || "9999999999",
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