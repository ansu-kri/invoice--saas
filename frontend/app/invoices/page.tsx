"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getInvoices, deleteInvoice, downloadInvoice, sendInvoiceToClientWithPdf } from "@/services/api";
import {reminderService} from "@/services/reminderServices";
import { handlePayment as processPayment } from "@/services/invoiceService";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getInvoiceDisplayStatus } from "@/lib/invoiceStatus";

type Invoice = {
  _id: string;
  clientName: string;
  clientEmail?: string;
  totalAmount: number;
  status: string;
  dueDate?: string;
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("createdAt:desc");
  const [totalPages, setTotalPages] = useState(0);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
  const [loadingReminder, setLoadingReminder] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      setLoadingInvoices(false);
      return;
    }

    try {
      setLoadingInvoices(true);
      const [sortField, direction] = sort.split(":");
      const data = await getInvoices(page, search, {
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        sort: sortField,
        direction,
      });
      setInvoices(data.invoices);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to fetch invoices");
    } finally {
      setLoadingInvoices(false);
    }
  }, [from, page, router, search, sort, status, to]);

  useEffect(() => {
    void Promise.resolve().then(fetchInvoices);
  }, [fetchInvoices]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const params = new URLSearchParams(window.location.search);
      const initialSearch = params.get("search");
      const initialStatus = params.get("status");
      if (initialSearch) setSearch(initialSearch);
      if (initialStatus) setStatus(initialStatus);
      try {
        setIsAdmin(JSON.parse(localStorage.getItem("user") || "null")?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    });
  }, []);

  // Delete invoice
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this invoice?"
    );
    if (!confirmDelete) return;

    try {
      await deleteInvoice(id);
      setInvoices((prev) => prev.filter((inv) => inv._id !== id));
      toast.success("Invoice deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete invoice");
    }
  };

  // Download invoice
  const handleDownload = async (id: string) => {
    try {
      await downloadInvoice(id);
      toast.success("Invoice downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download invoice");
    }
  };

  // Razorpay payment
  const handlePayment = async (invoice: Invoice) => {
    try {
      setLoadingPayment(invoice._id);
      await processPayment(invoice);
      toast.success("Payment successful");
      setLoadingPayment(null);
      fetchInvoices(); // refresh invoices
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Payment could not be completed.");
      setLoadingPayment(null);
    }
  };

  // Send invoice to client email
  const handleSendEmail = async (invoice: Invoice) => {
    try {
      if (!invoice.clientEmail) {
        toast.error("Client email not available");
        return;
      }
      await sendInvoiceToClientWithPdf(invoice._id);
      toast.success("Invoice sent to client successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send invoice email");
    }
  };

  // Send reminders for all overdue/pending invoices
  const handleSendReminders = async () => {
    try {
      setLoadingReminder(true);
      const result = await reminderService();
      toast.success(`${result.message} (${result.total})`);
      fetchInvoices(); // refresh to show updated status
      setLoadingReminder(false);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to send reminders");
      setLoadingReminder(false);
    }
  };

  return (
    <div className="module-page invoice-list-page">
      <div className="module-heading">
        <div><span className="eyebrow">BILLING WORKSPACE</span><h1>Invoices</h1><p>Search, manage, and follow up on your invoices.</p></div>
        <Link href="/invoices/new" className="dashboard-primary-action">+ Create invoice</Link>
      </div>
      <section className="module-table-panel invoice-list-panel">
        <div className="overflow-x-auto p-5">
        <div className="flex flex-col lg:flex-row justify-between mb-4 gap-3">
          <input
            type="text"
            placeholder="Search client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-64"
          />
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
            <input
              aria-label="Created from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"
            />
            <input
              aria-label="Created to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"
            />
            <select
              aria-label="Sort invoices"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="dueDate:asc">Due date</option>
              <option value="totalAmount:desc">Amount high to low</option>
              <option value="totalAmount:asc">Amount low to high</option>
            </select>
          </div>

          {isAdmin && <button
            onClick={handleSendReminders}
            disabled={loadingReminder}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            {loadingReminder ? "Sending..." : "Send Reminders"}
          </button>}
        </div>

        <table className="module-table min-w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Client
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Amount
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Status
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Due Date
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loadingInvoices ? (
              <tr><td colSpan={5}><div className="table-skeleton" /></td></tr>
            ) : invoices.length ? invoices.map((inv) => (
              <tr key={inv._id} className="border-b hover:bg-gray-50 transition">
                {/* Client */}
                <td className="px-6 py-4">
                  <Link href={`/invoices/${inv._id}`} className="font-semibold text-gray-800 hover:text-violet-700">
                    {inv.clientName}
                  </Link>
                  <div className="text-xs text-gray-500">
                    {inv.clientEmail || "No Email"}
                  </div>
                </td>

                {/* Amount */}
                <td className="px-6 py-4 font-medium">
                  ₹ {inv.totalAmount}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-semibold capitalize ${
                      getInvoiceDisplayStatus(inv.status, inv.dueDate) === "paid"
                        ? "bg-green-100 text-green-700"
                        : getInvoiceDisplayStatus(inv.status, inv.dueDate) === "overdue"
                        ? "bg-red-100 text-red-700"
                        : getInvoiceDisplayStatus(inv.status, inv.dueDate) === "sent"
                        ? "bg-purple-100 text-purple-700"
                        : getInvoiceDisplayStatus(inv.status, inv.dueDate) === "draft"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {getInvoiceDisplayStatus(inv.status, inv.dueDate)}
                  </span>
                </td>

                {/* Due Date */}
                <td className="px-6 py-4 font-medium text-gray-800">
                  {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 flex flex-wrap gap-2">

                  {/* Pay */}
                  {getInvoiceDisplayStatus(inv.status, inv.dueDate) !== "paid" && (
                    <button
                      onClick={() => handlePayment(inv)}
                      disabled={loadingPayment === inv._id}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      {loadingPayment === inv._id ? "Processing..." : "Pay"}
                    </button>
                  )}

                  {/* Download */}
                  <button
                    onClick={() => handleDownload(inv._id)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Download
                  </button>

                  {/* Send Email */}
                  <button
                    onClick={() => handleSendEmail(inv)}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Send Email
                  </button>

                  {/* Delete */}
                  {isAdmin && <button
                    onClick={() => handleDelete(inv._id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>}

                </td>
              </tr>
            )) : <tr><td className="module-table-empty" colSpan={5}><strong>No invoices found</strong><span>Try a different search or create your first invoice.</span></td></tr>}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Prev
          </button>
          <span className="font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={totalPages === 0 || page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
        </div>
        </section>
      </div>
  );
}