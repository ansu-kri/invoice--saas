"use client";

import { useEffect, useState } from "react";
import { getInvoices, deleteInvoice } from "@/services/api";
import { useRouter } from "next/navigation";

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const fetchInvoices = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const data = await getInvoices(page, search);
    setInvoices(data.invoices);
    setTotalPages(data.pages);
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, search]);

  const handleDelete = async (id: string) => {
    await deleteInvoice(id);
    fetchInvoices();
  };

  return (
    <div>
      <h1>Invoices</h1>

      <input
        placeholder="Search by client name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table border={1}>
        <thead>
          <tr>
            <th>Client</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((inv) => (
            <tr key={inv._id}>
              <td>{inv.clientName}</td>
              <td>{inv.totalAmount}</td>
              <td>{inv.status}</td>
              <td>
                <button onClick={() => handleDelete(inv._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>

        <span> Page {page} of {totalPages} </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}