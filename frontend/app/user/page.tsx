"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
// import { getUsers } from "@/services/api";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
};

export default function UsersListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Fetch users from backend
//   const fetchUsers = async () => {
//     if (!token) {
//       toast.error("Authentication token not found");
//       return;
//     }

//     try {
//       setLoading(true);
//       const data = await getUsers(token);
//       setUsers(data.users);
//     } catch (err: any) {
//       toast.error(err.message || "Failed to load users");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">All Users</h1>

        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="w-full border border-gray-300 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{user.name}</td>
                  <td className="py-2 px-4 border-b">{user.email}</td>
                  <td className="py-2 px-4 border-b">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}