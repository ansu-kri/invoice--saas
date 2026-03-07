"use client";

import { useEffect, useState } from "react";
import { getInvoices, deleteInvoice, downloadInvoice } from "@/services/api";
import { handlePayment as processPayment } from "@/services/invoiceService";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";

type Invoice = {
  _id: string;
  clientName: string;
  clientEmail?: string; // optional, for Razorpay prefill
  totalAmount: number;
  status: string;
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null); // track which invoice is paying

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
    const confirmDelete = confirm("Are you sure you want to delete this invoice?");
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
      setLoadingPayment(null);
      // Refresh invoices to reflect paid status
      fetchInvoices();
    } catch (err) {
      console.error(err);
      toast.error("Payment failed");
      setLoadingPayment(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <Toaster position="top-right" richColors />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <input
          type="text"
          placeholder="Search client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-left table-auto">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 sm:px-6 py-3">Client</th>
              <th className="px-4 sm:px-6 py-3">Amount</th>
              <th className="px-4 sm:px-6 py-3">Status</th>
              <th className="px-4 sm:px-6 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id} className="border-b hover:bg-gray-50">
                <td className="px-4 sm:px-6 py-4 font-medium">{inv.clientName}</td>
                <td className="px-4 sm:px-6 py-4">₹ {inv.totalAmount}</td>
                <td className="px-4 sm:px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      inv.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : inv.status === "sent"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDelete(inv._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer flex-1 sm:flex-none text-center"
                  >
                    Delete
                  </button>

                  <button
                    onClick={() => handlePayment(inv)}
                    disabled={loadingPayment === inv._id || inv.status === "paid"}
                    className={`px-3 py-1 rounded-lg flex-1 sm:flex-none text-center ${
                      inv.status === "paid"
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    {loadingPayment === inv._id ? "Processing..." : "Pay Now"}
                  </button>

                  <button
                    onClick={() => handleDownload(inv._id)}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex-1 sm:flex-none justify-center"
                    title="Download Invoice"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                      />
                    </svg>
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
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