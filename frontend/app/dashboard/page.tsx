"use client";

import { authFetch, getInvoices } from "@/services/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FaDollarSign, FaCheckCircle, FaClock, FaPaperPlane, FaFileInvoice } from "react-icons/fa";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasFetched = useRef(false);

  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchStats = async () => {
      try {
        const data = await authFetch("/api/invoices/dashboard/stats");
        setStats(data);

        const response = await getInvoices();
        setRecentInvoices(response.invoices.slice(0, 10));
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <p className="text-center animate-pulse">Loading Dashboard...</p>
      </div>
    );

  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Invoice Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
        <StatCard title="Total Revenue" value={`$${stats.totalRevenue}`} icon={<FaDollarSign />} color="text-blue-600" />
        <StatCard title="Paid Revenue" value={`$${stats.paidRevenue}`} icon={<FaCheckCircle />} color="text-green-600" />
        <StatCard title="Outstanding" value={`$${stats.totalRevenue - stats.paidRevenue}`} icon={<FaClock />} color="text-yellow-500" />
        <StatCard title="Pending" value={stats.draftCount} icon={<FaFileInvoice />} color="text-gray-500" />
        <StatCard title="Sent" value={stats.sentCount} icon={<FaPaperPlane />} color="text-purple-500" />
        <StatCard title="Paid" value={stats.paidCount} icon={<FaCheckCircle />} color="text-teal-500" />
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-gray-600 text-sm sm:text-base">Invoice ID</th>
              <th className="px-3 py-2 text-left text-gray-600 text-sm sm:text-base">Client</th>
              <th className="px-3 py-2 text-left text-gray-600 text-sm sm:text-base">Amount</th>
              <th className="px-3 py-2 text-left text-gray-600 text-sm sm:text-base">Status</th>
              <th className="px-3 py-2 text-left text-gray-600 text-sm sm:text-base">Created At</th>
              <th className="px-3 py-2 text-left text-gray-600 text-sm sm:text-base">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {recentInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500 text-sm">
                  No invoices found
                </td>
              </tr>
            ) : (
              recentInvoices.map((inv) => (
                <tr key={inv._id} className="border-b hover:bg-gray-50 transition text-sm sm:text-base">
                  <td className="px-3 py-2">{inv._id.slice(-6)}</td>
                  <td className="px-3 py-2">{inv.clientName}</td>
                  <td className="px-3 py-2">${inv.totalAmount}</td>
                  <td className={`px-3 py-2 font-semibold ${statusColor(inv.status)}`}>{inv.status}</td>
                  <td className="px-3 py-2">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{new Date(inv.dueDate || inv.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper: returns color classes for status
function statusColor(status: string) {
  switch (status) {
    case "paid":
      return "text-green-600";
    case "sent":
      return "text-purple-500";
    case "draft":
      return "text-yellow-500";
    default:
      return "text-gray-500";
  }
}

// Stat Card
function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-5 flex flex-col items-center hover:shadow-xl transition-shadow w-full">
      <div className={`mb-2 text-xl sm:text-2xl ${color}`}>{icon}</div>
      <h2 className="text-base sm:text-lg font-semibold mb-1 text-center">{title}</h2>
      <p className={`text-lg sm:text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}