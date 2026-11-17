"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteExpense, ExpenseRecord, getExpenses, saveExpense } from "@/services/api";

type ExpenseForm = {
  description: string;
  category: string;
  vendor: string;
  amount: string;
  date: string;
};

const emptyForm = (): ExpenseForm => ({
  description: "",
  category: "",
  vendor: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
});

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [summary, setSummary] = useState({ totalAmount: 0, count: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [editing, setEditing] = useState<ExpenseRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getExpenses(page, search);
      setExpenses(result.expenses);
      setSummary(result.summary);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load expenses.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    try {
      setIsAdmin(JSON.parse(localStorage.getItem("user") || "null")?.role === "admin");
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const openForm = (expense?: ExpenseRecord) => {
    setEditing(expense || null);
    setFormOpen(true);
    setForm(expense ? {
      description: expense.description,
      category: expense.category,
      vendor: expense.vendor || "",
      amount: String(expense.amount),
      date: new Date(expense.date).toISOString().slice(0, 10),
    } : emptyForm());
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveExpense({
        ...form,
        amount: Number(form.amount),
        date: new Date(`${form.date}T12:00:00`).toISOString(),
      }, editing?._id);
      toast.success(editing ? "Expense updated." : "Expense recorded.");
      setEditing(null);
      setFormOpen(false);
      await loadExpenses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expense: ExpenseRecord) => {
    if (!window.confirm(`Delete "${expense.description}"? This cannot be undone.`)) return;
    try {
      await deleteExpense(expense._id);
      toast.success("Expense deleted.");
      await loadExpenses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete expense.");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Date", "Description", "Category", "Vendor", "Amount"],
      ...expenses.map((expense) => [
        new Date(expense.date).toISOString().slice(0, 10),
        expense.description,
        expense.category,
        expense.vendor || "",
        String(expense.amount),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "expenses.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="module-page">
      <div className="module-heading">
        <div><span className="eyebrow">CASH FLOW</span><h1>Expenses</h1><p>Track business spending with organization-scoped records.</p></div>
        <button className="dashboard-primary-action" onClick={() => openForm()}>+ Add expense</button>
      </div>
      <div className="module-summary-grid">
        <div className="module-summary-card"><span>Recorded expenses</span><strong>{summary.count}</strong><small>For the current search</small></div>
        <div className="module-summary-card"><span>Total spend</span><strong>₹{summary.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong><small>Based on matching records</small></div>
      </div>
      <section className="module-table-panel">
        <div className="module-table-heading">
          <div><h2>Expense records</h2><p>Search expenses and export the current page.</p></div>
          <button className="module-secondary-action" onClick={exportCsv} disabled={!expenses.length}>Export CSV</button>
        </div>
        <div className="module-filters">
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search description, category, vendor" aria-label="Search expenses" />
        </div>
        <div className="module-table-wrap">
          <table className="module-table">
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Vendor</th><th>Amount</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6}><div className="table-skeleton" /></td></tr>
                : expenses.length ? expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>{new Date(`${expense.date.slice(0, 10)}T00:00:00`).toLocaleDateString()}</td>
                    <td>{expense.description}</td>
                    <td>{expense.category}</td>
                    <td>{expense.vendor || "—"}</td>
                    <td>₹{expense.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="module-row-actions">
                      <button onClick={() => openForm(expense)}>Edit</button>
                      {isAdmin && <button className="module-danger-action" onClick={() => void handleDelete(expense)}>Delete</button>}
                    </td>
                  </tr>
                )) : <tr><td className="module-table-empty" colSpan={6}><strong>No expenses found</strong><span>Add an expense or adjust your search.</span></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="module-pagination">
          <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <span>Page {page} of {Math.max(totalPages, 1)}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      </section>

      {formOpen && (
        <div className="module-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) { setEditing(null); setFormOpen(false); }
        }}>
          <form className="module-form-card" onSubmit={handleSave}>
            <div className="module-table-heading"><div><h2>{editing ? "Edit expense" : "Add expense"}</h2><p>Save a real expense to your business account.</p></div><button type="button" onClick={() => { setEditing(null); setFormOpen(false); setForm(emptyForm()); }} aria-label="Close">×</button></div>
            <label>Description<input required maxLength={200} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <div className="module-form-grid">
              <label>Category<input required maxLength={80} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Travel, software, supplies..." /></label>
              <label>Vendor<input maxLength={120} value={form.vendor} onChange={(event) => setForm({ ...form, vendor: event.target.value })} /></label>
              <label>Amount (INR)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
              <label>Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
            </div>
            <div className="module-form-actions"><button type="button" onClick={() => { setEditing(null); setFormOpen(false); setForm(emptyForm()); }}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving..." : "Save expense"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
