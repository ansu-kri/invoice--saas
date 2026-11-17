"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LuArrowLeft, LuDownload, LuMail, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { toast } from "sonner";
import { authFetch, downloadInvoice, sendInvoiceToClientWithPdf } from "@/services/api";
import { getInvoiceDisplayStatus } from "@/lib/invoiceStatus";

type Item = { description: string; quantity: number; price: number };
type Invoice = {
  _id: string;
  clientName: string;
  clientEmail?: string;
  totalAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
  items: Item[];
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount || 0);

export default function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<Item[]>([]);

  const loadInvoice = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await authFetch<Invoice>(`/invoices/${encodeURIComponent(id)}`);
      setInvoice(result);
      setClientName(result.clientName);
      setClientEmail(result.clientEmail || "");
      setDueDate(result.dueDate.slice(0, 10));
      setItems(result.items || []);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Could not load invoice.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(loadInvoice);
  }, [loadInvoice]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        setIsAdmin(JSON.parse(localStorage.getItem("user") || "null")?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    });
  }, []);

  const saveInvoice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoice) return;
    setSaving(true);
    try {
      const updated = await authFetch<Invoice>(`/invoices/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ clientName, clientEmail, dueDate, items }),
      });
      setInvoice(updated);
      setEditing(false);
      toast.success("Invoice updated.");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Could not update invoice.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      const updated = await authFetch<Invoice>(`/invoices/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setInvoice(updated);
      toast.success("Invoice status updated.");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Could not update status.");
    }
  };

  if (loading && !invoice) return <div className="module-page"><div className="customer-detail-skeleton" /></div>;
  if (!invoice) {
    return <div className="module-page"><div className="module-empty" role="alert"><strong>Invoice unavailable</strong><span>{error || "This invoice may have been deleted or is not in your workspace."}</span><Link href="/invoices">Back to invoices</Link></div></div>;
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const displayStatus = getInvoiceDisplayStatus(invoice.status, invoice.dueDate);
  const statusLabel = displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);

  return (
    <div className="module-page">
      <Link href="/invoices" className="customer-back-link"><LuArrowLeft /> Invoices</Link>
      <section className="invoice-detail-header">
        <div>
          <span className="eyebrow">INVOICE · {invoice._id.slice(-6).toUpperCase()}</span>
          <h1>{invoice.clientName}</h1>
          <p>{invoice.clientEmail || "No client email"} · Created {new Date(invoice.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="invoice-detail-actions">
          <button type="button" onClick={() => void downloadInvoice(invoice._id)}><LuDownload /> PDF</button>
          <button type="button" disabled={!invoice.clientEmail} onClick={async () => {
            try { await sendInvoiceToClientWithPdf(invoice._id); toast.success("Invoice sent to client."); }
            catch (requestError) { toast.error(requestError instanceof Error ? requestError.message : "Email could not be sent."); }
          }}><LuMail /> Send</button>
          {String(invoice.status).toLowerCase() !== "paid" && <button type="button" onClick={() => setEditing((value) => !value)}><LuPencil /> {editing ? "Cancel edit" : "Edit"}</button>}
        </div>
      </section>

      <section className="invoice-detail-summary">
        <div><span>Status</span><strong><span className={`status-pill status-${displayStatus}`}>{statusLabel}</span></strong></div>
        <div><span>Invoice total</span><strong>{money(invoice.totalAmount)}</strong></div>
        <div><span>Due date</span><strong>{new Date(invoice.dueDate).toLocaleDateString()}</strong></div>
        {isAdmin && <label><span>Update status</span><select value={invoice.status} onChange={(event) => void updateStatus(event.target.value)}><option>Draft</option><option>Pending</option><option>Sent</option><option>Paid</option><option>Overdue</option></select></label>}
      </section>

      {editing ? (
        <section className="module-table-panel invoice-edit-panel">
          <div className="module-table-heading"><div><h2>Edit invoice</h2><p>Paid invoices are locked to preserve payment records.</p></div></div>
          <form onSubmit={saveInvoice} className="invoice-edit-form">
            <div className="invoice-edit-fields">
              <label>Client name<input required value={clientName} onChange={(event) => setClientName(event.target.value)} /></label>
              <label>Client email<input type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} /></label>
              <label>Due date<input required type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
            </div>
            <div className="invoice-edit-items">
              {items.map((item, index) => (
                <div className="invoice-edit-item" key={index}>
                  <label>Description<input required value={item.description} onChange={(event) => setItems((current) => current.map((entry, row) => row === index ? { ...entry, description: event.target.value } : entry))} /></label>
                  <label>Qty<input required min="0.01" step="any" type="number" value={item.quantity} onChange={(event) => setItems((current) => current.map((entry, row) => row === index ? { ...entry, quantity: Number(event.target.value) } : entry))} /></label>
                  <label>Price<input required min="0" step="any" type="number" value={item.price} onChange={(event) => setItems((current) => current.map((entry, row) => row === index ? { ...entry, price: Number(event.target.value) } : entry))} /></label>
                  <button type="button" aria-label="Remove item" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, row) => row !== index))}><LuTrash2 /></button>
                </div>
              ))}
              <button type="button" className="invoice-add-item" onClick={() => setItems((current) => [...current, { description: "", quantity: 1, price: 0 }])}><LuPlus /> Add item</button>
              <div className="invoice-edit-total">New total <strong>{money(total)}</strong></div>
            </div>
            <div className="invoice-edit-footer"><button type="button" onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="dashboard-primary-action" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div>
          </form>
        </section>
      ) : (
        <section className="module-table-panel invoice-detail-items">
          <div className="module-table-heading"><div><h2>Items</h2><p>Invoice line items and amounts</p></div></div>
          <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Description</th><th>Quantity</th><th>Unit price</th><th className="module-align-right">Amount</th></tr></thead><tbody>
            {invoice.items.map((item, index) => <tr key={`${item.description}-${index}`}><td><strong>{item.description}</strong></td><td>{item.quantity}</td><td>{money(item.price)}</td><td className="module-align-right module-amount">{money(item.quantity * item.price)}</td></tr>)}
            <tr className="invoice-total-row"><td colSpan={3}>Total</td><td className="module-align-right">{money(invoice.totalAmount)}</td></tr>
          </tbody></table></div>
        </section>
      )}
    </div>
  );
}
