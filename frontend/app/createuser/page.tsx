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

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!token) {
      toast.error("Authentication token not found");
      return;
    }

    try {
      await createUser(
        { name, email, password, role },
        token
      );

      toast.success("User created successfully!");
      router.push("/user");
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-12">
      <div className="max-w-xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Create User</h1>

        {/* Name */}
        <div className="flex flex-col mb-4">
          <label className="mb-2 text-gray-600 font-medium">Name</label>
          <input
            type="text"
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col mb-4">
          <label className="mb-2 text-gray-600 font-medium">Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col mb-4">
          <label className="mb-2 text-gray-600 font-medium">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300"
          />
        </div>

        {/* Role */}
        <div className="flex flex-col mb-6">
          <label className="mb-2 text-gray-600 font-medium">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "staff")}
            className="px-4 py-2 rounded-lg border border-gray-300"
          >
            <option value="staff">Staff</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            Create User
          </button>
        </div>
      </div>
    </div>
  );
}