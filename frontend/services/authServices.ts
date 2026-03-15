const API_URL = process.env.NEXT_PUBLIC_API_URL;


//================Resigner new Admin=================
export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}) => {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  // Check if response is OK
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to register");
  }

  return res.json();
};

//================login User and Admin=====================
export const loginUser = async ( data: {
  email: string;
  password: string;
}) => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}