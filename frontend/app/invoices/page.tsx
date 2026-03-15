"use client";

import { useEffect, useState } from "react";
import { getInvoices, deleteInvoice, downloadInvoice, sendInvoiceToClientWithPdf } from "@/services/api";
import {reminderService} from "@/services/reminderServices";
import { handlePayment as processPayment } from "@/services/invoiceService";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";

type Invoice = {
  _id: string;
  clientName: string;
  clientEmail?: string;
  totalAmount: number;
  status: "pending" | "paid" | "overdue";
  dueDate: string; // <-- new field
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
  const [loadingReminder, setLoadingReminder] = useState(false);

  // Fetch invoices
  const fetchInvoices = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const data = await getInvoices(page, search);
      setInvoices(data.invoices);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch invoices");
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, search]);

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
      toast.error("Payment failed");
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send reminders");
      setLoadingReminder(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <Toaster />
      <div className="overflow-x-auto p-5">
        <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
          <input
            type="text"
            placeholder="Search client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />

          <button
            onClick={handleSendReminders}
            disabled={loadingReminder}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            {loadingReminder ? "Sending..." : "Send Reminders"}
          </button>
        </div>

        <table className="min-w-full text-left">
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
            {invoices.map((inv) => (
              <tr key={inv._id} className="border-b hover:bg-gray-50 transition">
                {/* Client */}
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-800">
                    {inv.clientName}
                  </div>
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
                      inv.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : inv.status === "overdue"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>

                {/* Due Date */}
                <td className="px-6 py-4 font-medium text-gray-800">
                  {new Date(inv.dueDate).toLocaleDateString()}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 flex flex-wrap gap-2">

                  {/* Pay */}
                  {inv.status !== "paid" && (
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
                  <button
                    onClick={() => handleDelete(inv._id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>

                </td>
              </tr>
            ))}
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
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}