import { authFetch } from "@/services/api";

type PayableInvoice = {
  _id: string;
  clientName: string;
  clientEmail?: string;
  totalAmount: number;
};

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email?: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
  handler: (response: RazorpaySuccess) => Promise<void>;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

export const handlePayment = async (invoice: PayableInvoice): Promise<void> => {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY;
  if (!key) throw new Error("Razorpay is not configured for this application.");
  if (!window.Razorpay) throw new Error("The secure payment window is not available. Please try again.");

  const order = await authFetch<{ id: string; amount: number; currency: string }>(
    `/api/invoices/${encodeURIComponent(invoice._id)}/create-order`,
    { method: "POST", body: JSON.stringify({}) },
  );

  await new Promise<void>((resolve, reject) => {
    const checkout = new window.Razorpay!({
      key,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: "Invoice SaaS",
      description: `Invoice payment for ${invoice.clientName}`,
      prefill: {
        name: invoice.clientName,
        ...(invoice.clientEmail ? { email: invoice.clientEmail } : {}),
      },
      theme: { color: "#5546e8" },
      modal: { ondismiss: () => reject(new Error("Payment window was closed.")) },
      handler: async (response) => {
        try {
          const result = await authFetch<{ status: string }>("/api/invoices/verify-payment", {
            method: "POST",
            body: JSON.stringify({ invoiceId: invoice._id, ...response }),
          });
          if (result.status.toLowerCase() !== "paid") {
            throw new Error("The payment could not be verified.");
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      },
    });

    checkout.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Payment was not completed."));
    });
    checkout.open();
  });
};
