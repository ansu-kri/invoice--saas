"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LuArrowLeft, LuFileText, LuUserRound } from "react-icons/lu";
import { toast } from "sonner";
import { authFetch, type CustomerRecord } from "@/services/api";

type CustomerDetail = {
  customer: CustomerRecord;
  invoices: {
    _id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    dueDate: string;
  }[];
  summary: { invoiceCount: number; totalBilled: number; totalPaid: number; outstanding: number };
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomer = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDetail(await authFetch<CustomerDetail>(`/customers/${encodeURIComponent(id)}`));
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Could not load customer.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(loadCustomer);
  }, [loadCustomer]);

  if (loading && !detail) {
    return <div className="module-page"><div className="customer-detail-skeleton" /></div>;
  }
  if (error && !detail) {
    return <div className="module-page"><div className="module-empty" role="alert"><strong>Customer couldn&apos;t be loaded</strong><span>{error}</span><Link href="/customers">Back to customers</Link></div></div>;
  }
  if (!detail) return null;

  return (
    <div className="module-page">
      <Link href="/customers" className="customer-back-link"><LuArrowLeft /> Customers</Link>
      <section className="customer-profile-card">
        <div className="customer-profile-avatar"><LuUserRound /></div>
        <div className="customer-profile-copy">
          <span className="eyebrow">CUSTOMER PROFILE</span>
          <h1>{detail.customer.name}</h1>
          <p>{detail.customer.email || "No email address"}{detail.customer.phone ? ` · ${detail.customer.phone}` : ""}</p>
        </div>
        <Link href="/invoices/new" className="dashboard-primary-action"><LuFileText /> Create invoice</Link>
      </section>

      <section className="module-summary-grid customer-detail-summary">
        <article className="module-summary-card"><span>Invoices</span><strong>{detail.summary.invoiceCount}</strong><small>Invoice history</small></article>
        <article className="module-summary-card"><span>Total billed</span><strong>{money(detail.summary.totalBilled)}</strong><small>All customer invoices</small></article>
        <article className="module-summary-card"><span>Total paid</span><strong>{money(detail.summary.totalPaid)}</strong><small>Marked paid</small></article>
        <article className="module-summary-card"><span>Outstanding</span><strong>{money(detail.summary.outstanding)}</strong><small>Not marked paid</small></article>
      </section>

      <section className="module-table-panel">
        <div className="module-table-heading"><div><h2>Invoice history</h2><p>Latest invoices for {detail.customer.name}</p></div></div>
        <div className="module-table-wrap">
          <table className="module-table">
            <thead><tr><th>Invoice</th><th>Created</th><th>Due date</th><th>Status</th><th className="module-align-right">Amount</th></tr></thead>
            <tbody>
              {detail.invoices.length ? detail.invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td><span className="module-id">INV-{invoice._id.slice(-6).toUpperCase()}</span></td>
                  <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                  <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td><span className={`status-pill status-${invoice.status.toLowerCase()}`}>{invoice.status}</span></td>
                  <td className="module-align-right module-amount">{money(invoice.totalAmount)}</td>
                </tr>
              )) : <tr><td className="module-table-empty" colSpan={5}><LuFileText /><strong>No invoices yet</strong><span>Invoices created for this customer will appear here.</span></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
