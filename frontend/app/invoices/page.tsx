
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  getInvoices,
  deleteInvoice,
  downloadInvoice,
  sendInvoiceToClientWithPdf,
} from "@/services/api";
import { reminderService } from "@/services/reminderServices";
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

type InvoiceStatus =
  | "paid"
  | "pending"
  | "overdue"
  | "draft"
  | "sent"
  | string;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const formatDate = (date?: string) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const getStatusStyles = (status: InvoiceStatus) => {
  const styles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    overdue: "bg-red-50 text-red-700 ring-red-600/20",
    draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
    sent: "bg-violet-50 text-violet-700 ring-violet-600/20",
  };

  return styles[String(status).toLowerCase()] ||
    "bg-slate-100 text-slate-600 ring-slate-500/20";
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getInitials = (name: string) => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

export default function InvoicesPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("createdAt:desc");

  const [totalPages, setTotalPages] = useState(0);

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingReminder, setLoadingReminder] = useState(false);

  const [busyInvoiceId, setBusyInvoiceId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize existing URL filters and user permissions.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const initialSearch = params.get("search") || "";
    const initialStatus = params.get("status") || "";

    setSearch(initialSearch);
    setDebouncedSearch(initialSearch);
    setStatus(initialStatus);

    try {
      const user = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      setIsAdmin(user?.role === "admin");
    } catch {
      setIsAdmin(false);
    }
  }, []);

  // Debounce search requests.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  // Fetch existing database invoices using the original API.
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

      const data = await getInvoices(
        page,
        debouncedSearch,
        {
          status: status || undefined,
          from: from || undefined,
          to: to || undefined,
          sort: sortField,
          direction,
        }
      );

      setInvoices(data.invoices || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error("Invoice fetch error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load invoices"
      );
    } finally {
      setLoadingInvoices(false);
    }
  }, [
    page,
    debouncedSearch,
    status,
    from,
    to,
    sort,
    router,
  ]);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  // Reset pagination when filters change.
  const updateFilter = (
    callback: () => void
  ) => {
    callback();
    setPage(1);
  };

  // Prevent multiple simultaneous operations.
  const runInvoiceAction = async (
    invoiceId: string,
    action: string,
    callback: () => Promise<void>
  ) => {
    if (busyInvoiceId) return;

    setBusyInvoiceId(invoiceId);
    setBusyAction(action);

    try {
      await callback();
    } finally {
      setBusyInvoiceId(null);
      setBusyAction(null);
    }
  };

  // Delete invoice using original backend API.
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this invoice? This action cannot be undone."
    );

    if (!confirmed) return;

    await runInvoiceAction(id, "delete", async () => {
      try {
        await deleteInvoice(id);

        toast.success("Invoice deleted successfully");

        await fetchInvoices();
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete invoice");
      }
    });
  };

  // Download invoice PDF.
  const handleDownload = async (id: string) => {
    await runInvoiceAction(id, "download", async () => {
      try {
        await downloadInvoice(id);
        toast.success("Invoice downloaded successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to download invoice");
      }
    });
  };

  // Existing Razorpay payment integration.
  const handlePayment = async (invoice: Invoice) => {
    await runInvoiceAction(invoice._id, "payment", async () => {
      try {
        await processPayment(invoice);

        toast.success("Payment successful");

        await fetchInvoices();
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Payment could not be completed"
        );
      }
    });
  };

  // Send invoice through existing email API.
  const handleSendEmail = async (invoice: Invoice) => {
    if (!invoice.clientEmail) {
      toast.error("Client email is not available");
      return;
    }

    await runInvoiceAction(invoice._id, "email", async () => {
      try {
        await sendInvoiceToClientWithPdf(invoice._id);

        toast.success("Invoice sent successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to send invoice email");
      }
    });
  };

  // Existing reminder service.
  const handleSendReminders = async () => {
    if (loadingReminder) return;

    try {
      setLoadingReminder(true);

      const result = await reminderService();

      toast.success(
        `${result.message} (${result.total})`
      );

      await fetchInvoices();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send reminders"
      );
    } finally {
      setLoadingReminder(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setFrom("");
    setTo("");
    setSort("createdAt:desc");
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-6 sm:px-6 lg:px-8">
      {/* PAGE HEADER */}
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
            <span className="h-2 w-2 rounded-full bg-violet-600" />
            Billing Workspace
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Invoices
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage your invoices, track payments and follow up with clients.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={handleSendReminders}
              disabled={loadingReminder}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>↗</span>
              {loadingReminder ? "Sending..." : "Send Reminders"}
            </button>
          )}
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
          >
            <span className="text-lg leading-none">+</span>
            Create Invoice
          </Link>
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                All Invoices
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search and manage your billing records.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchInvoices()}
              disabled={loadingInvoices}
              className="mt-3 self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:mt-0"
            >
              ↻ Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="relative xl:col-span-2">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search invoice or client..."
                aria-label="Search invoices and clients"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              />
            </div>
            <select
              aria-label="Filter by invoice status"
              value={status}
              onChange={(event) =>
                updateFilter(() => setStatus(event.target.value))
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
            {/* SORT */}
            <select
              aria-label="Sort invoices"
              value={sort}
              onChange={(event) =>
                updateFilter(() => setSort(event.target.value))
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="dueDate:asc">Due date</option>
              <option value="totalAmount:desc">Highest amount</option>
              <option value="totalAmount:asc">Lowest amount</option>
            </select>
          </div>
          {/* DATE FILTERS */}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Date range
            </span>
            <input
              type="date"
              aria-label="Created from"
              value={from}
              max={to || undefined}
              onChange={(event) =>
                updateFilter(() => setFrom(event.target.value))
              }
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none focus:border-violet-400"
            />
            <span className="hidden text-slate-400 sm:block">to</span>
            <input
              type="date"
              aria-label="Created to"
              value={to}
              min={from || undefined}
              onChange={(event) =>
                updateFilter(() => setTo(event.target.value))
              }
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none focus:border-violet-400"
            />
            <button
              type="button"
              onClick={resetFilters}
              className="self-start rounded-lg px-3 py-2 text-sm font-semibold text-violet-600 transition hover:bg-violet-50 sm:self-auto"
            >
              Clear filters
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Client
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Amount
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Due Date
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* LOADING */}
              {loadingInvoices ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="flex animate-pulse items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-40 rounded bg-slate-100" />
                          <div className="h-3 w-28 rounded bg-slate-100" />
                        </div>
                        <div className="h-5 w-20 rounded bg-slate-100" />
                        <div className="h-5 w-20 rounded bg-slate-100" />
                      </div>
                    </td>
                  </tr>
                ))

              ) : invoices.length > 0 ? (
                invoices.map((invoice) => {
                  const displayStatus = getInvoiceDisplayStatus(
                    invoice.status,
                    invoice.dueDate
                  ).toLowerCase();
                  const isBusy = busyInvoiceId === invoice._id;
                  return (
                    <tr
                      key={invoice._id}
                      className="group transition hover:bg-violet-50/30"
                    >
                      {/* CLIENT */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">
                            {getInitials(invoice.clientName || "Client")}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/invoices/${invoice._id}`}
                              className="block truncate text-sm font-bold text-slate-800 transition hover:text-violet-700"
                            >
                              {invoice.clientName || "Unknown client"}
                            </Link>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {invoice.clientEmail || "No email available"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5">
                        <span className="text-sm font-bold text-slate-800">
                          {formatCurrency(invoice.totalAmount)}
                        </span>
                      </td>
                      {/* STATUS */}
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ring-inset ${getStatusStyles(displayStatus)}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {getStatusLabel(displayStatus)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5">
                        <span className="text-sm font-medium text-slate-600">
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/invoices/${invoice._id}`}
                            title="View invoice"
                            aria-label={`View invoice for ${invoice.clientName}`}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                          >
                            View
                          </Link>
                          {displayStatus !== "paid" &&
                            displayStatus !== "draft" && (
                            <button
                              type="button"
                              onClick={() => void handlePayment(invoice)}
                              disabled={!!busyInvoiceId}
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy && busyAction === "payment"
                                ? "Processing..."
                                : "Pay"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleDownload(invoice._id)}
                            disabled={!!busyInvoiceId}
                            title="Download invoice"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                          >
                            {isBusy && busyAction === "download"
                              ? "Downloading..."
                              : "Download"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSendEmail(invoice)}
                            disabled={!!busyInvoiceId}
                            title="Send invoice by email"
                            className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
                          >
                            {isBusy && busyAction === "email"
                              ? "Sending..."
                              : "Email"}
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(invoice._id)}
                              disabled={!!busyInvoiceId}
                              title="Delete invoice"
                              className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              {isBusy && busyAction === "delete"
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })

              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-600">
                      ▤
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      No invoices found
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                      No invoices match your current filters. Try changing your search or create a new invoice.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Clear filters
                      </button>

                      <Link
                        href="/invoices/new"
                        className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                      >
                        Create Invoice
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-500">
            Page <span className="font-bold text-slate-800">{page}</span>
            {" "}of{" "}
            <span className="font-bold text-slate-800">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loadingInvoices}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700">
              {page}
            </span>
            <button
              type="button"
              disabled={
                totalPages === 0 ||
                page >= totalPages ||
                loadingInvoices
              }
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
