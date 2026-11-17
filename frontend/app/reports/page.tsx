"use client";

import { useCallback, useEffect, useState } from "react";
import { LuChartNoAxesCombined, LuDownload, LuFileText } from "react-icons/lu";
import { toast } from "sonner";
import { authFetch } from "@/services/api";

type ReportData = {
  summary: { totalInvoices: number; totalBilled: number; paid: number; outstanding: number };
  statusSummary: { _id: string; count: number; amount: number }[];
  monthly: { month: string; invoiceCount: number; billed: number }[];
  customers: { customer: string; invoiceCount: number; billed: number; paid: number }[];
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

function toInputDate(date: Date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const today = toInputDate(new Date());
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ from, to });
      setReport(await authFetch<ReportData>(`/reports/invoices?${query}`));
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Could not load reports.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void Promise.resolve().then(loadReport);
  }, [loadReport]);

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ["Report", "Invoice summary"],
      ["Period", `${from} to ${to}`],
      [],
      ["Status", "Invoice count", "Amount"],
      ...report.statusSummary.map((item) => [item._id, item.count, item.amount]),
      [],
      ["Customer", "Invoices", "Billed", "Paid", "Outstanding"],
      ...report.customers.map((customer) => [
        customer.customer,
        customer.invoiceCount,
        customer.billed,
        customer.paid,
        customer.billed - customer.paid,
      ]),
    ];
    const csv = rows.map((row) => row.map((field) => {
      const value = String(field ?? "");
      return `"${value.replace(/"/g, '""')}"`;
    }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-report-${from}-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const peak = Math.max(...(report?.monthly.map((month) => month.billed) || [0]), 1);
  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <span className="eyebrow">BUSINESS PERFORMANCE</span>
          <h1>Reports &amp; analytics</h1>
          <p>Understand billed revenue, collections, and customer contribution.</p>
        </div>
        <div className="report-actions">
          <div className="module-date-filter">
            <label>From <input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} /></label>
            <label>To <input type="date" value={to} min={from} max={today} onChange={(event) => setTo(event.target.value)} /></label>
          </div>
          <button type="button" className="report-export" disabled={!report} onClick={exportCsv}>
            <LuDownload /> Export CSV
          </button>
        </div>
      </div>

      {error && !report ? (
        <div className="module-empty" role="alert">
          <strong>Reports couldn&apos;t be loaded</strong><span>{error}</span>
          <button type="button" onClick={() => void loadReport()}>Try again</button>
        </div>
      ) : (
        <>
          <section className="module-summary-grid report-summary">
            <article className="module-summary-card"><span><LuFileText /> Invoices issued</span><strong>{loading ? "—" : report?.summary.totalInvoices || 0}</strong><small>Created in the selected period</small></article>
            <article className="module-summary-card"><span><LuChartNoAxesCombined /> Total billed</span><strong>{loading ? "—" : money(report?.summary.totalBilled || 0)}</strong><small>Invoice value in the selected period</small></article>
            <article className="module-summary-card"><span><LuChartNoAxesCombined /> Paid revenue</span><strong>{loading ? "—" : money(report?.summary.paid || 0)}</strong><small>Invoices marked paid</small></article>
            <article className="module-summary-card"><span><LuChartNoAxesCombined /> Outstanding</span><strong>{loading ? "—" : money(report?.summary.outstanding || 0)}</strong><small>Invoices not marked paid</small></article>
          </section>

          <div className="report-grid">
            <section className="module-table-panel report-chart-panel">
              <div className="module-table-heading"><div><h2>Monthly invoice volume</h2><p>Billed value and invoice count</p></div><LuChartNoAxesCombined /></div>
              {loading ? <div className="chart-skeleton" /> : report?.monthly.length ? (
                <div className="report-chart">
                  {report.monthly.map((month) => (
                    <div className="report-chart-column" key={month.month} title={`${month.month}: ${money(month.billed)}, ${month.invoiceCount} invoices`}>
                      <span>{money(month.billed)}</span>
                      <div className="report-chart-track"><i style={{ height: `${Math.max((month.billed / peak) * 100, 4)}%` }} /></div>
                      <small>{month.month}</small>
                      <b>{month.invoiceCount}</b>
                    </div>
                  ))}
                </div>
              ) : <div className="dashboard-empty"><LuChartNoAxesCombined /><strong>No report data for this period</strong></div>}
            </section>

            <section className="module-table-panel report-status-panel">
              <div className="module-table-heading"><div><h2>Invoice status</h2><p>Count and value by status</p></div></div>
              <div className="report-status-list">
                {loading ? <div className="status-skeleton" /> : report?.statusSummary.length ? report.statusSummary.map((item) => (
                  <div className="report-status-row" key={item._id}>
                    <span className={`status-pill status-${item._id}`}>{item._id}</span>
                    <strong>{item.count}</strong>
                    <small>{money(item.amount)}</small>
                  </div>
                )) : <span className="report-no-data">No invoices in this period.</span>}
              </div>
            </section>
          </div>

          <section className="module-table-panel report-customer-panel">
            <div className="module-table-heading"><div><h2>Customer revenue</h2><p>Top customers by billed amount</p></div></div>
            <div className="module-table-wrap">
              <table className="module-table">
                <thead><tr><th>Customer</th><th>Invoices</th><th>Billed</th><th>Paid</th><th className="module-align-right">Outstanding</th></tr></thead>
                <tbody>
                  {loading ? [1, 2, 3].map((row) => <tr key={row}><td colSpan={5}><div className="table-skeleton" /></td></tr>) :
                    report?.customers.length ? report.customers.map((customer, index) => (
                      <tr key={`${customer.customer}-${index}`}>
                        <td><strong>{customer.customer || "Unnamed customer"}</strong></td>
                        <td>{customer.invoiceCount}</td>
                        <td>{money(customer.billed)}</td>
                        <td>{money(customer.paid)}</td>
                        <td className="module-align-right module-amount">{money(customer.billed - customer.paid)}</td>
                      </tr>
                    )) : <tr><td className="module-table-empty" colSpan={5}>No customers with invoices in this period.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
