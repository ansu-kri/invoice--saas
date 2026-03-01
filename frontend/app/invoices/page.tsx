"use client";

import { useEffect, useState } from "react";
import { getInvoices, deleteInvoice } from "@/services/api";
import { useRouter } from "next/navigation";

type Invoice = {
  _id: string;
  clientName: string;
  totalAmount: number;
  status: string;
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(0);

  const fetchInvoices = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const data = await getInvoices(page, search);
    setInvoices(data.invoices);
    setTotalPages(data.totalPages);
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, search]);

  const handleDelete = async (id: string) => {
    await deleteInvoice(id);
    fetchInvoices();
  };

  return (
  <div className="p-8 bg-gray-100 min-h-screen">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Invoices</h1>

      <input
        type="text"
        placeholder="Search client..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="min-w-full text-left">
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
              <td className="px-6 py-4 font-medium">
                {inv.clientName}
              </td>

              <td className="px-6 py-4">
                ₹ {inv.totalAmount}
              </td>

              <td className="px-6 py-4">
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

              <td className="px-6 py-4">
                <button
                  onClick={() => handleDelete(inv._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
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