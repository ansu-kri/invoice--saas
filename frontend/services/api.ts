const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type UserInput = {
  name: string;
  email: string;
  password: string;
  role?: "staff" | "admin";
};

export type InvoiceRecord = {
  _id: string;
  clientName: string;
  clientEmail?: string;
  totalAmount: number;
  status: string;
  dueDate?: string;
  createdAt: string;
};

type UserRecord = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
};

export type CustomerRecord = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  invoiceStats?: { invoiceCount: number; totalBilled: number; totalPaid: number };
};

export type ExpenseRecord = {
  _id: string;
  description: string;
  category: string;
  vendor?: string;
  amount: number;
  date: string;
};

export type NotificationRecord = {
  _id: string;
  type: "invoice" | "payment" | "system";
  title: string;
  message: string;
  href?: string;
  readAt?: string | null;
  createdAt: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }
  return payload as T;
}

function apiUrl(endpoint: string) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }
  return `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
}

export const authFetch = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Your session has expired. Please sign in again.");

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(apiUrl(endpoint), { ...options, headers });
  return parseResponse<T>(response);
};

export const getInvoices = async (
  page = 1,
  search = "",
  filters: { status?: string; from?: string; to?: string; sort?: string; direction?: string } = {},
) => {
  const query = new URLSearchParams({
    page: String(page),
    limit: "10",
    search,
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return authFetch<{
    total: number;
    page: number;
    totalPages: number;
    invoices: InvoiceRecord[];
  }>(`/invoices?${query}`);
};

export const deleteInvoice = async (id: string) =>
  authFetch(`/invoices/${encodeURIComponent(id)}`, { method: "DELETE" });

export const createInvoice = async (data: {
  clientName: string;
  clientEmail?: string;
  items: { description: string; quantity: number; price: number }[];
}) =>
  authFetch<InvoiceRecord>("/invoices", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const createUser = async (data: UserInput, token: string) => {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(apiUrl("/users/users"), {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  return parseResponse(response);
};

export const getUsers = async (page = 1, search = "") => {
  const query = new URLSearchParams({
    page: String(page),
    limit: "10",
    search,
  });
  return authFetch<{
    total: number;
    page: number;
    totalPages: number;
    users: UserRecord[];
  }>(`/users?${query}`);
};

export const deleteUser = async (id: string) =>
  authFetch(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });

export const getCustomers = async (page = 1, search = "") => {
  const query = new URLSearchParams({ page: String(page), limit: "10", search });
  return authFetch<{
    total: number;
    page: number;
    totalPages: number;
    customers: CustomerRecord[];
  }>(`/customers?${query}`);
};

export const saveCustomer = async (
  customer: Partial<CustomerRecord> & { name: string },
  id?: string,
) =>
  authFetch<CustomerRecord>(id ? `/customers/${encodeURIComponent(id)}` : "/customers", {
    method: id ? "PATCH" : "POST",
    body: JSON.stringify(customer),
  });

export const deleteCustomer = async (id: string) =>
  authFetch(`/customers/${encodeURIComponent(id)}`, { method: "DELETE" });

export const getExpenses = async (page = 1, search = "") => {
  const query = new URLSearchParams({ page: String(page), limit: "10", search });
  return authFetch<{
    total: number;
    page: number;
    totalPages: number;
    expenses: ExpenseRecord[];
    summary: { totalAmount: number; count: number };
  }>(`/expenses?${query}`);
};

export const saveExpense = async (
  expense: Omit<ExpenseRecord, "_id">,
  id?: string,
) =>
  authFetch<ExpenseRecord>(id ? `/expenses/${encodeURIComponent(id)}` : "/expenses", {
    method: id ? "PATCH" : "POST",
    body: JSON.stringify(expense),
  });

export const deleteExpense = async (id: string) =>
  authFetch(`/expenses/${encodeURIComponent(id)}`, { method: "DELETE" });

export const getNotifications = async (page = 1) =>
  authFetch<{
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
    notifications: NotificationRecord[];
  }>(`/notifications?page=${page}&limit=20`);

export const markNotificationRead = async (id: string) =>
  authFetch<NotificationRecord>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });

export const markAllNotificationsRead = async () =>
  authFetch<{ updated: number }>("/notifications/read-all", { method: "PATCH" });

export const downloadInvoice = async (id: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Your session has expired. Please sign in again.");

  const response = await fetch(apiUrl(`/invoices/${encodeURIComponent(id)}/download`), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || "Failed to download invoice.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const sendInvoiceToClientWithPdf = async (id: string) =>
  authFetch(`/invoices/${encodeURIComponent(id)}/send-email`, {
    method: "POST",
  });
