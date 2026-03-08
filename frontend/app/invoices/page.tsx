"use client";

import { useEffect, useState } from "react";
import { getInvoices, deleteInvoice, downloadInvoice } from "@/services/api";
import { handlePayment as processPayment } from "@/services/invoiceService";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";

type Invoice = {
  _id: string;
  clientName: string;
  clientEmail?: string;
  totalAmount: number;
  status: "pending" | "paid" | "overdue";
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);

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

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Invoices</h1>

        <input
          type="text"
          placeholder="Search client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-left table-auto">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{inv.clientName}</td>

                <td className="px-6 py-4">₹ {inv.totalAmount}</td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
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

                {/* Actions */}
                <td className="px-6 py-4 flex flex-wrap gap-2">
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(inv._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>

                  {/* Pay button only if not paid */}
                  {inv.status !== "paid" && (
                    <button
                      onClick={() => handlePayment(inv)}
                      disabled={loadingPayment === inv._id}
                      className={`px-3 py-1 rounded-lg ${
                        inv.status === "overdue"
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {loadingPayment === inv._id
                        ? "Processing..."
                        : inv.status === "overdue"
                        ? "Pay Overdue"
                        : "Pay Now"}
                    </button>
                  )}

                  {/* Download */}
                  <button
                    onClick={() => handleDownload(inv._id)}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
  );
}