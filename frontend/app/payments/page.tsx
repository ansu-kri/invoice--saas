"use client";

import { useCallback, useEffect, useState } from "react";
import { LuArrowUpRight, LuCircleCheck, LuCreditCard, LuReceipt } from "react-icons/lu";
import { toast } from "sonner";
import { authFetch } from "@/services/api";

type PaymentRecord = {
  _id: string;
  invoiceId: { _id: string; clientName: string; totalAmount: number } | null;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
};

type PaymentResponse = {
  total: number;
  totalPages: number;
  page: number;
  payments: PaymentRecord[];
  summary: { totalAmount: number; totalPayments: number };
};

const money = (amount: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentResponse | null>(null);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page), limit: "10" });
      if (from) query.set("from", from);
      if (to) query.set("to", to);
      setData(await authFetch<PaymentResponse>(`/payments?${query}`));
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Could not load payments.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [from, page, to]);

  useEffect(() => {
    void Promise.resolve().then(loadPayments);
  }, [loadPayments]);

  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <span className="eyebrow">MONEY IN</span>
          <h1>Payments</h1>
          <p>Verified Razorpay transactions from your invoices.</p>
        </div>
        <div className="module-date-filter">
          <label>From <input type="date" value={from} max={to || undefined} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></label>
          <label>To <input type="date" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></label>
        </div>
      </div>

      <section className="module-summary-grid">
        <article className="module-summary-card">
          <span><LuCreditCard /> Captured payments</span>
          <strong>{loading ? "—" : data?.summary.totalPayments || 0}</strong>
          <small>Successful transactions in the selected range</small>
        </article>
        <article className="module-summary-card">
          <span><LuCircleCheck /> Amount received</span>
          <strong>{loading ? "—" : money(data?.summary.totalAmount || 0)}</strong>
          <small>Recorded only after provider verification</small>
        </article>
      </section>

      <section className="module-table-panel">
        <div className="module-table-heading">
          <div><h2>Transaction history</h2><p>{data?.total || 0} verified transactions</p></div>
          <LuReceipt aria-hidden="true" />
        </div>
        {error && !data ? (
          <div className="module-empty" role="alert">
            <strong>Payments couldn&apos;t be loaded</strong>
            <span>{error}</span>
            <button type="button" onClick={() => void loadPayments()}>Try again</button>
          </div>
        ) : (
          <>
            <div className="module-table-wrap">
              <table className="module-table">
                <thead><tr><th>Transaction</th><th>Invoice / customer</th><th>Method</th><th>Date</th><th>Status</th><th className="module-align-right">Amount</th></tr></thead>
                <tbody>
                  {loading ? [1, 2, 3].map((row) => <tr key={row}><td colSpan={6}><div className="table-skeleton" /></td></tr>) :
                    data?.payments.length ? data.payments.map((payment) => (
                      <tr key={payment._id}>
                        <td><span className="module-id">{payment.providerPaymentId}</span><small>{payment.providerOrderId}</small></td>
                        <td>{payment.invoiceId ? <><strong>{payment.invoiceId.clientName}</strong><small>INV-{payment.invoiceId._id.slice(-6).toUpperCase()}</small></> : "Invoice unavailable"}</td>
                        <td><span className="module-provider">Razorpay</span></td>
                        <td>{new Date(payment.paidAt).toLocaleString()}</td>
                        <td><span className="status-pill status-paid">Captured</span></td>
                        <td className="module-align-right module-amount">{money(payment.amount, payment.currency)}</td>
                      </tr>
                    )) : (
                      <tr><td className="module-table-empty" colSpan={6}>
                        <LuReceipt /><strong>No payments in this range</strong>
                        <span>Once an invoice payment is successfully captured, it will appear here.</span>
                      </td></tr>
                    )}
                </tbody>
              </table>
            </div>
            <div className="module-pagination">
              <span>Page {page} of {Math.max(data?.totalPages || 0, 1)}</span>
              <div>
                <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
                <button disabled={!data || page >= data.totalPages} onClick={() => setPage((value) => value + 1)}>Next <LuArrowUpRight /></button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
