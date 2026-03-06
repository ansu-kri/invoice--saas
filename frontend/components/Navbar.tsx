"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HiMenu, HiX } from "react-icons/hi"; // Hamburger & close icons

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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

  const links = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "User", path: "/createuser" },
    { name: "User Profile", path: "/user" },
    { name: "Invoices", path: "/invoices" },
    { name: "Create", path: "/invoices/new" },
  ];

  return (
    <nav className="bg-white shadow-md px-4 sm:px-8 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Invoice SaaS</h1>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-4 items-center">
          {links.map((link) => (
            <div key={link.path} onClick={() => router.push(link.path)} className={linkClass(link.path)}>
              {link.name}
            </div>
          ))}

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <HiX size={28} /> : <HiMenu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-2 flex flex-col gap-2 bg-white shadow-inner rounded-lg p-4">
          {links.map((link) => (
            <div
              key={link.path}
              onClick={() => {
                router.push(link.path);
                setIsOpen(false);
              }}
              className={linkClass(link.path)}
            >
              {link.name}
            </div>
          ))}

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 w-full"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}