"use client";

import { createUser } from "@/services/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function CreateUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [token, setToken] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!token) {
      toast.error("Authentication token not found");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      await createUser(
        { name, email, password, role },
        token
      );

      toast.success("User created successfully!");

      router.push("/user");
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#f5f6fa] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 md:px-8 py-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m14-13a4 4 0 11-8 0 4 4 0 018 0zm4 13v-2a4 4 0 00-3-3.87M18 4.13a4 4 0 010 7.75"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      User information
                    </h2>
                    <p className="text-sm text-gray-500">
                      Enter the details of your new team member.
                    </p>
                  </div>
                </div>
              </div>
              <form
                onSubmit={handleSubmit}
                className="p-6 md:p-8 space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m12-13a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                      />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="11"
                        rx="2"
                      />
                      <path d="M8 10V7a4 4 0 118 0v3" />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="w-full pl-12 pr-16 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Set a password for the new team member.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    User role
                  </label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) =>
                        setRole(e.target.value as "admin" | "staff")
                      }
                      className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm outline-none cursor-pointer transition-all hover:border-gray-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    >
                      <option value="staff">Staff</option>
                    </select>
                    <svg
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m6 9 6 6 6-6"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Staff members can access the workspace according
                    to their assigned permissions.
                  </p>
                </div>
                <div className="pt-5 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/user")}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-7 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 5v14m-7-7h14"
                          />
                        </svg>
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="space-y-5">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 12 2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">
                Workspace security
              </h3>
              <p className="text-sm text-gray-500 mt-2 leading-6">
                Each team member gets an individual account.
                Keep account credentials secure and assign
                appropriate permissions.
              </p>
            </div>
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 11v5m0-8h.01"
                  />
                </svg>
                <h3 className="font-semibold text-indigo-900">
                  Before you create
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-indigo-800/80">
                <li className="flex gap-2">
                  <span className="text-indigo-600">✓</span>
                  Enter the team member's correct name.
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-600">✓</span>
                  Use a valid email address.
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-600">✓</span>
                  Assign the appropriate user role.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}