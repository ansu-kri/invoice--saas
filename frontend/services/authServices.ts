const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

async function postAuth(endpoint: string, data: object) {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }
  return payload;
}

//================Resigner new Admin=================
export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}) => {
  return postAuth("/auth/register", data);
};

//================login User and Admin=====================
export const loginUser = async ( data: {
  email: string;
  password: string;
}) => {
  return postAuth("/auth/login", data);
};