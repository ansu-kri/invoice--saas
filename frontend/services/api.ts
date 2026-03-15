const API_URL = process.env.NEXT_PUBLIC_API_URL;


//==================authFetch==================================
export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    }
  });
  return res.json();
}

// But every protected API (invoices, dashboard, etc.) needs:

// Authorization: Bearer TOKEN

// Instead of writing this everywhere, we create a reusable fetch helper.

//============================getAllInvoice=============================
export const getInvoices = async (page= 1, search = "") => {
  return authFetch(`/api/invoices?page=${page}&limit=4&search=${search}`);
}

//====================DeleteInvoice by admin========================
export const deleteInvoice = async (id: string) => {
  return authFetch(`/api/invoices/${id}`, {
    method: "DELETE",
  });
};

//===================Create Invoice======================
export const createInvoice = async (data: any) => {
  return authFetch("/api/invoices",{
    method:"POST",
    body: JSON.stringify(data),
  })
}

//====================Create User by admin=======================
export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role?: "staff" | "admin";
}, token: string) => {
  const res = await fetch(`${API_URL}/api/users/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create user");
  }

  return res.json();
};

//=================Get all User=====================
export const getUsers = async (page= 1, search = "") => {
  return authFetch(`/api/users?page=${page}&limit=4&search=${search}`);
}

//======================Download invoice===========================
export const downloadInvoice = async (id: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token found");

  // Use the backend URL from environment variable
  const response = await fetch(`${API_URL}/api/invoices/${id}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to download invoice");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

//====================sendInvoiceWithPDf======================
export const sendInvoiceToClientWithPdf = async (id: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token found");

  const response = await fetch(`${API_URL}/api/invoices/${id}/send-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to send invoice email");
  }

  return response.json();
};

