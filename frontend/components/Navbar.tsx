"use client";

import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `px-4 py-2 rounded-lg cursor-pointer ${
      pathname === path
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-gray-200"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="flex justify-between items-center px-8 py-4 bg-white shadow-md">
      <h1 className="text-xl font-bold text-blue-600">Invoice SaaS</h1>

      <div className="flex gap-4 items-center">
        <div onClick={() => router.push("/dashboard")} className={linkClass("/dashboard")}>
          Dashboard
        </div>
        <div onClick={() => router.push("/createuser")} className={linkClass("/createuser")}>
          User
        </div>

        <div onClick={() => router.push("/invoices")} className={linkClass("/invoices")}>
          Invoices
        </div>

        <div onClick={() => router.push("/invoices/new")} className={linkClass("/invoices/new")}>
          Create
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}