"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LuPencil, LuPlus, LuTrash2, LuUsers } from "react-icons/lu";
import { toast } from "sonner";
import {
  deleteCustomer,
  getCustomers,
  saveCustomer,
  type CustomerRecord,
} from "@/services/api";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getCustomers(page, search);
      setCustomers(result.customers);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Could not load customers.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void Promise.resolve().then(loadCustomers);
  }, [loadCustomers]);

  const openForm = (customer?: CustomerRecord) => {
    setEditing(customer || null);
    setName(customer?.name || "");
    setEmail(customer?.email || "");
    setPhone(customer?.phone || "");
    setAddress(customer?.address || "");
    setFormOpen(true);
  };

  const submitCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveCustomer(
        {
          name,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
        },
        editing?._id,
      );
      toast.success(editing ? "Customer updated." : "Customer added.");
      setFormOpen(false);
      await loadCustomers();
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Could not save customer.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeCustomer = async (customer: CustomerRecord) => {
    if (
      !window.confirm(
        `Delete ${customer.name}? Existing invoices will be kept.`,
      )
    )
      return;
    try {
      await deleteCustomer(customer._id);
      toast.success("Customer deleted.");
      await loadCustomers();
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Could not delete customer.",
      );
    }
  };

  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <span className="eyebrow">CUSTOMER DIRECTORY</span>
          <h1>Customers</h1>
          <p>Manage your clients and review their invoice balances.</p>
        </div>
        <button
          type="button"
          className="dashboard-primary-action"
          onClick={() => openForm()}
        >
          <LuPlus /> Add customer
        </button>
      </div>

      <section className="module-table-panel customer-panel">
        <div className="customer-toolbar">
          <div className="module-table-heading">
            <div>
              <h2>All customers</h2>
              <p>{total} customers in your workspace</p>
            </div>
            <LuUsers />
          </div>
          <input
            type="search"
            value={search}
            placeholder="Search name or email..."
            aria-label="Search customers"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        {error && !customers.length ? (
          <div className="module-empty" role="alert">
            <strong>Customers couldn&apos;t be loaded</strong>
            <span>{error}</span>
            <button type="button" onClick={() => void loadCustomers()}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="module-table-wrap">
              <table className="module-table customer-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Invoices</th>
                    <th>Total billed</th>
                    <th>Paid</th>
                    <th>Outstanding</th>
                    <th className="module-align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3].map((row) => (
                      <tr key={row}>
                        <td colSpan={7}>
                          <div className="table-skeleton" />
                        </td>
                      </tr>
                    ))
                  ) : customers.length ? (
                    customers.map((customer) => {
                      const stats = customer.invoiceStats || {
                        invoiceCount: 0,
                        totalBilled: 0,
                        totalPaid: 0,
                      };
                      return (
                        <tr key={customer._id}>
                          <td>
                            <Link
                              className="customer-name-link"
                              href={`/customers/${customer._id}`}
                            >
                              {customer.name}
                            </Link>
                            <small>
                              Added{" "}
                              {new Date(
                                customer.createdAt || "",
                              ).toLocaleDateString()}
                            </small>
                          </td>
                          <td>
                            <strong>{customer.email || "No email"}</strong>
                            <small>{customer.phone || "No phone"}</small>
                          </td>
                          <td>{stats.invoiceCount}</td>
                          <td>{money(stats.totalBilled)}</td>
                          <td>{money(stats.totalPaid)}</td>
                          <td className="customer-balance">
                            {money(stats.totalBilled - stats.totalPaid)}
                          </td>
                          <td className="module-align-right">
                            <div className="customer-row-actions">
                              <button
                                type="button"
                                title="Edit customer"
                                aria-label={`Edit ${customer.name}`}
                                onClick={() => openForm(customer)}
                              >
                                <LuPencil />
                              </button>
                              <button
                                type="button"
                                title="Delete customer"
                                aria-label={`Delete ${customer.name}`}
                                onClick={() => void removeCustomer(customer)}
                              >
                                <LuTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="module-table-empty" colSpan={7}>
                        <LuUsers />
                        <strong>No customers found</strong>
                        <span>Add a customer or adjust your search.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="module-pagination">
              <span>
                Page {page} of {Math.max(totalPages, 1)}
              </span>
              <div>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </button>
                <button
                  disabled={!totalPages || page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {formOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFormOpen(false);
          }}
        >
          <section
            className="customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-modal-title"
          >
            <div className="modal-heading">
              <div>
                <h2 id="customer-modal-title">
                  {editing ? "Edit customer" : "Add customer"}
                </h2>
                <p>Customer information is private to your organization.</p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setFormOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={submitCustomer}>
              <label>
                Name{" "}
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                />
              </label>
              <label>
                Email{" "}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                Phone{" "}
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
              <label>
                Address{" "}
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  rows={3}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dashboard-primary-action"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Save changes"
                      : "Add customer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
