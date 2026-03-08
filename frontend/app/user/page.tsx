"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteInvoice, getUsers } from "@/services/api";

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
  const fetchUsers = async () => {
    if (!token) {
      toast.error("Authentication token not found");
      return;
    }

    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data.users);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice(id);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-12">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          All Users
        </h1>

        {loading ? (
          <p className="text-gray-600">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3 sm:px-4 border-b text-left text-sm sm:text-base">
                    Name
                  </th>
                  <th className="py-2 px-3 sm:px-4 border-b text-left text-sm sm:text-base">
                    Email
                  </th>
                  <th className="py-2 px-3 sm:px-4 border-b text-left text-sm sm:text-base">
                    Role
                  </th>
                  <th className="py-2 px-3 sm:px-4 border-b text-left text-sm sm:text-base">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="py-2 px-3 sm:px-4 border-b text-sm sm:text-base">
                      {user.name}
                    </td>
                    <td className="py-2 px-3 sm:px-4 border-b text-sm sm:text-base break-all">
                      {user.email}
                    </td>
                    <td className="py-2 px-3 sm:px-4 border-b text-sm sm:text-base">
                      {user.role}
                    </td>
                    <td className="py-2 px-3 sm:px-4 border-b">
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="px-3 py-1 text-sm sm:text-base bg-red-500 text-white rounded-lg hover:bg-red-600 w-full sm:w-auto"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}