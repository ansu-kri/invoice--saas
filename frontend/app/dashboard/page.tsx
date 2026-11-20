"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuArrowDownRight,
  LuArrowUpRight,
  LuCheck,
  LuClock3,
  LuFileText,
  LuPlus,
  LuTriangleAlert,
} from "react-icons/lu";
import { toast } from "sonner";
import { authFetch } from "@/services/api";
import { getInvoiceDisplayStatus } from "@/lib/invoiceStatus";

type Invoice = {
  _id: string;
  clientName: string;
  totalAmount: number;
  status: string;
  dueDate?: string;
  createdAt: string;
};

type DashboardStats = {
  totalRevenue: number;
  paidRevenue: number;
  outstandingAmount: number;
  totalInvoices: number;
  paidCount: number;
  pendingCount: number;
  draftCount: number;
  sentCount: number;
  overdueCount: number;
  revenueTrend: { date: string; amount: number }[];
  recentInvoices: Invoice[];
  paymentAlerts: { overdueCount: number; upcomingInvoices: Invoice[] };
};

type Range = "7d" | "30d" | "3m" | "6m" | "year" | "custom";

const rangeOptions: { label: string; value: Range }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "3 months", value: "3m" },
  { label: "6 months", value: "6m" },
  { label: "This year", value: "year" },
  { label: "Custom", value: "custom" },
];

function localDateString(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function getRangeDates(range: Range, customFrom: string, customTo: string) {
  const today = new Date();
  const to = localDateString(today);
  const fromDate = new Date(today);

  if (range === "custom") {
    return { from: customFrom, to: customTo };
  }
  if (range === "year") {
    fromDate.setMonth(0, 1);
  } else if (range === "3m") {
    fromDate.setMonth(fromDate.getMonth() - 3);
  } else if (range === "6m") {
    fromDate.setMonth(fromDate.getMonth() - 6);
  } else {
    fromDate.setDate(fromDate.getDate() - (range === "7d" ? 6 : 29));
  }
  return { from: localDateString(fromDate), to };
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function statusClass(invoice: Invoice) {
  switch (getInvoiceDisplayStatus(invoice.status, invoice.dueDate)) {
    case "paid":
      return "status-pill status-paid";
    case "overdue":
      return "status-pill status-overdue";
    case "sent":
      return "status-pill status-sent";
    case "draft":
      return "status-pill status-draft";
    default:
      return "status-pill status-pending";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [range, setRange] = useState<Range>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState(localDateString(new Date()));
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dates = useMemo(
    () => getRangeDates(range, customFrom, customTo),
    [range, customFrom, customTo],
  );

  const loadDashboard = useCallback(async () => {
    if (range === "custom" && (!dates.from || !dates.to)) return;
    setLoading(true);
    setError("");
    try {
      if (!localStorage.getItem("token")) {
        router.replace("/login");
        return;
      }
      const query = new URLSearchParams({ from: dates.from, to: dates.to });
      const result = await authFetch<Partial<DashboardStats>>(
        `/api/invoices/dashboard/stats?${query}`,
      );
      setStats({
        ...result,
        revenueTrend: Array.isArray(result.revenueTrend)
          ? result.revenueTrend
          : [],
        recentInvoices: Array.isArray(result.recentInvoices)
          ? result.recentInvoices
          : [],
        paymentAlerts: {
          overdueCount: result.paymentAlerts?.overdueCount ?? 0,
          upcomingInvoices: Array.isArray(
            result.paymentAlerts?.upcomingInvoices,
          )
            ? result.paymentAlerts.upcomingInvoices
            : [],
        },
      } as DashboardStats);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Could not load dashboard.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [dates.from, dates.to, range, router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const maxTrend = Math.max(
    ...(stats?.revenueTrend.map((point) => point.amount) || [0]),
    1,
  );
  const summaryCards = [
    {
      title: "Total invoiced",
      value: currency(stats?.totalRevenue || 0),
      icon: LuFileText,
      tone: "violet",
    },
    {
      title: "Paid revenue",
      value: currency(stats?.paidRevenue || 0),
      icon: LuCheck,
      tone: "green",
    },
    {
      title: "Outstanding",
      value: currency(stats?.outstandingAmount || 0),
      icon: LuClock3,
      tone: "amber",
    },
    {
      title: "Total invoices",
      value: String(stats?.totalInvoices || 0),
      icon: LuArrowUpRight,
      tone: "blue",
    },
    {
      title: "Paid invoices",
      value: String(stats?.paidCount || 0),
      icon: LuCheck,
      tone: "green",
    },
    {
      title: "Pending invoices",
      value: String(stats?.pendingCount || 0),
      icon: LuClock3,
      tone: "amber",
    },
    {
      title: "Overdue invoices",
      value: String(stats?.overdueCount || 0),
      icon: LuTriangleAlert,
      tone: "red",
    },
  ];

  const statusCounts = [
    { label: "Paid", value: stats?.paidCount || 0, tone: "paid" },
    { label: "Pending", value: stats?.pendingCount || 0, tone: "pending" },
    { label: "Sent", value: stats?.sentCount || 0, tone: "sent" },
    { label: "Overdue", value: stats?.overdueCount || 0, tone: "overdue" },
    { label: "Draft", value: stats?.draftCount || 0, tone: "draft" },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow">YOUR BUSINESS AT A GLANCE</div>
          <h1>Overview</h1>
          <p>Track invoices and keep your cash flow moving.</p>
        </div>
        <Link href="/invoices/new" className="dashboard-primary-action">
          <LuPlus aria-hidden="true" /> Create invoice
        </Link>
      </div>

      <div className="dashboard-controls">
        <div className="range-tabs" aria-label="Dashboard date range">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              className={
                range === option.value
                  ? "range-tab range-tab-active"
                  : "range-tab"
              }
            >
              {option.label}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="custom-date-range">
            <label>
              <span>From</span>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(event) => setCustomFrom(event.target.value)}
              />
            </label>
            <label>
              <span>To</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                max={localDateString(new Date())}
                onChange={(event) => setCustomTo(event.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      {error && !stats ? (
        <section className="dashboard-error" role="alert">
          <LuTriangleAlert />
          <div>
            <strong>We couldn&apos;t load your dashboard</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={() => void loadDashboard()}>
            Try again
          </button>
        </section>
      ) : (
        <>
          <section className="metric-grid" aria-label="Invoice metrics">
            {summaryCards.map(({ title, value, icon: Icon, tone }) => (
              <article className="metric-card" key={title}>
                <div className="metric-card-top">
                  <span>{title}</span>
                  <span className={`metric-icon metric-icon-${tone}`}>
                    <Icon aria-hidden="true" />
                  </span>
                </div>
                {loading ? (
                  <div className="metric-skeleton" />
                ) : (
                  <strong className="metric-value">{value}</strong>
                )}
                <span className="metric-footnote">
                  {title === "Total invoiced"
                    ? "Invoices issued in this period"
                    : title === "Paid revenue"
                      ? "Payments recorded in this period"
                      : title === "Outstanding"
                        ? "Not yet marked as paid"
                        : title === "Total invoices"
                          ? "Created in this period"
                          : `${title.replace(" invoices", "")} in this period`}
                </span>
              </article>
            ))}
          </section>

          <div className="dashboard-grid">
            <section className="dashboard-panel revenue-panel">
              <div className="panel-heading">
                <div>
                  <h2>Revenue overview</h2>
                  <p>
                    Paid invoice amounts by {range === "7d" ? "day" : "month"}
                  </p>
                </div>
                <span className="panel-period">
                  {dates.from} – {dates.to}
                </span>
              </div>
              {loading ? (
                <div className="chart-skeleton" />
              ) : stats?.revenueTrend.length ? (
                <div
                  className="revenue-chart"
                  role="img"
                  aria-label="Paid revenue trend"
                >
                  {stats.revenueTrend.map((point) => (
                    <div
                      className="chart-column"
                      key={point.date}
                      title={`${point.date}: ${currency(point.amount)}`}
                    >
                      <span className="chart-amount">
                        {currency(point.amount)}
                      </span>
                      <div className="chart-bar-track">
                        <div
                          className="chart-bar"
                          style={{
                            height: `${Math.max((point.amount / maxTrend) * 100, 4)}%`,
                          }}
                        />
                      </div>
                      <span className="chart-label">{point.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty">
                  <LuArrowDownRight />
                  <strong>No paid revenue in this period</strong>
                  <span>
                    Revenue will appear here as payments are recorded.
                  </span>
                </div>
              )}
            </section>

            <section className="dashboard-panel status-panel">
              <div className="panel-heading">
                <div>
                  <h2>Invoice status</h2>
                  <p>Current period breakdown</p>
                </div>
              </div>
              {loading ? (
                <div className="status-skeleton" />
              ) : (
                <div className="status-list">
                  {statusCounts.map((status) => {
                    const total = stats?.totalInvoices || 0;
                    const percent = total ? (status.value / total) * 100 : 0;
                    return (
                      <div className="status-row" key={status.label}>
                        <div className="status-row-label">
                          <span
                            className={`status-dot status-dot-${status.tone}`}
                          />
                          <span>{status.label}</span>
                          <strong>{status.value}</strong>
                        </div>
                        <div className="status-track">
                          <div
                            className={`status-progress status-progress-${status.tone}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {(stats?.paymentAlerts.overdueCount || 0) > 0 && (
            <Link href="/invoices?status=overdue" className="overdue-banner">
              <LuTriangleAlert aria-hidden="true" />
              <span>
                <strong>
                  {stats?.paymentAlerts.overdueCount} overdue invoice
                  {stats?.paymentAlerts.overdueCount === 1 ? "" : "s"}
                </strong>{" "}
                need your attention.
              </span>
              <span className="overdue-link">
                Review invoices <LuArrowUpRight />
              </span>
            </Link>
          )}

          <section className="dashboard-panel upcoming-panel">
            <div className="panel-heading">
              <div>
                <h2>Due in the next 7 days</h2>
                <p>Upcoming customer payments</p>
              </div>
              <Link href="/invoices" className="panel-link">
                View invoices <LuArrowUpRight />
              </Link>
            </div>
            {loading ? (
              <div className="status-skeleton" />
            ) : stats?.paymentAlerts.upcomingInvoices.length ? (
              <div className="upcoming-list">
                {stats.paymentAlerts.upcomingInvoices.map((invoice) => (
                  <Link
                    href={`/invoices/${invoice._id}`}
                    className="upcoming-row"
                    key={invoice._id}
                  >
                    <span className="upcoming-avatar">
                      {invoice.clientName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="upcoming-customer">
                      <strong>{invoice.clientName}</strong>
                      <small>
                        Due{" "}
                        {invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString()
                          : "soon"}
                      </small>
                    </span>
                    <span className="upcoming-amount">
                      {currency(invoice.totalAmount)}
                    </span>
                    <span className={statusClass(invoice)}>
                      {getInvoiceDisplayStatus(invoice.status, invoice.dueDate)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty upcoming-empty">
                <LuClock3 />
                <strong>No upcoming payments</strong>
                <span>Unpaid invoices due within 7 days will appear here.</span>
              </div>
            )}
          </section>

          <section className="dashboard-panel recent-panel">
            <div className="panel-heading">
              <div>
                <h2>Recent invoices</h2>
                <p>Your latest activity</p>
              </div>
              <Link href="/invoices" className="panel-link">
                View all invoices <LuArrowUpRight />
              </Link>
            </div>
            <div className="recent-table-wrap">
              <table className="recent-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Created</th>
                    <th>Due date</th>
                    <th>Status</th>
                    <th className="align-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3].map((row) => (
                      <tr key={row}>
                        <td colSpan={6}>
                          <div className="table-skeleton" />
                        </td>
                      </tr>
                    ))
                  ) : stats?.recentInvoices.length ? (
                    stats.recentInvoices.map((invoice) => (
                      <tr key={invoice._id}>
                        <td>
                          <span className="invoice-number">
                            INV-{invoice._id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="customer-cell">{invoice.clientName}</td>
                        <td>
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {invoice.dueDate
                            ? new Date(invoice.dueDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          <span className={statusClass(invoice)}>
                            {getInvoiceDisplayStatus(
                              invoice.status,
                              invoice.dueDate,
                            )}
                          </span>
                        </td>
                        <td className="align-right amount-cell">
                          {currency(invoice.totalAmount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="table-empty" colSpan={6}>
                        <LuFileText />
                        <strong>No invoices yet</strong>
                        <span>
                          Create your first invoice to see activity here.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
