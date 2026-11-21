"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteUser, getUsers } from "@/services/api";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
};

type RoleFilter = "all" | "admin" | "staff";

export default function UsersListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch users from the original backend API.
  const fetchUsers = useCallback(async (showRefresh = false) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Authentication token not found");
      setLoading(false);
      router.push("/login");
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getUsers();

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load team members"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Search and role filtering using actual fetched database records.
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesRole =
        roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Statistics calculated from actual backend records.
  const totalMembers = users.length;

  const adminCount = users.filter(
    (user) => user.role === "admin"
  ).length;

  const staffCount = users.filter(
    (user) => user.role === "staff"
  ).length;

  // Delete confirmation and duplicate-action prevention.
  const handleDelete = async (id: string) => {
    if (deletingId) return;
    const userToDelete = users.find((user) => user._id === id);
    if (!userToDelete) return;
    const confirmed = window.confirm(
      `Are you sure you want to remove ${userToDelete.name} from your team?`
    );
    if (!confirmed) return;
    try {
      setDeletingId(id);
      await deleteUser(id);
      setUsers((previousUsers) =>
        previousUsers.filter((user) => user._id !== id)
      );

      toast.success("Team member deleted successfully");
    } catch (error) {
      console.error("Delete user error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete team member"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-violet-100 text-violet-700",
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-orange-100 text-orange-700",
      "bg-pink-100 text-pink-700",
      "bg-indigo-100 text-indigo-700",
    ];

    const index = name
      .split("")
      .reduce((sum, character) => sum + character.charCodeAt(0), 0);

    return colors[index % colors.length];
  };

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
            <span className="h-2 w-2 rounded-full bg-violet-600" />
            Workspace Administration
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Team Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage your workspace members, roles, and access permissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchUsers(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <span>↻</span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          {/* Add member requires a backend API which is not currently provided. */}
          <button
            type="button"
            disabled
            title="Add Member API is not available in the current implementation"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white opacity-60 shadow-lg shadow-violet-600/20"
          >
            <span className="text-lg leading-none">+</span>
            Add Team Member
          </button>
        </div>
      </div>
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Members
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {loading ? "—" : totalMembers}
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                Registered workspace users
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-600">
              ♙
            </div>
          </div>
        </div>
        {/* ADMIN MEMBERS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Administrators
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {loading ? "—" : adminCount}
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                Members with admin role
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
              ♜
            </div>
          </div>
        </div>
        {/* STAFF MEMBERS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Staff Members
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {loading ? "—" : staffCount}
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                Members with staff role
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
              ♧
            </div>
          </div>
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Workspace Members
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage your existing team members.
            </p>
          </div>
          {/* SEARCH AND FILTER */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email..."
                aria-label="Search team members"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              />
            </div>
            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as RoleFilter)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                roleFilter === "all"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Members ({totalMembers})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("admin")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                roleFilter === "admin"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Admin ({adminCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("staff")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                roleFilter === "staff"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Staff ({staffCount})
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Team Member
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email Address
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* LOADING SKELETON */}
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={4} className="px-6 py-5">
                      <div className="flex animate-pulse items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-slate-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-40 rounded bg-slate-100" />
                          <div className="h-3 w-28 rounded bg-slate-100" />
                        </div>
                        <div className="h-6 w-20 rounded-full bg-slate-100" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="group transition hover:bg-violet-50/30"
                  >
                    {/* MEMBER */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${getAvatarColor(user.name)}`}
                        >
                          {getInitials(user.name || "User")}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {user.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Workspace member
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* EMAIL */}
                    <td className="px-6 py-5">
                      <span className="break-all text-sm text-slate-600">
                        {user.email}
                      </span>
                    </td>
                    {/* ROLE */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ring-inset ${
                          user.role === "admin"
                            ? "bg-violet-50 text-violet-700 ring-violet-600/20"
                            : "bg-blue-50 text-blue-700 ring-blue-600/20"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {user.role}
                      </span>
                    </td>
                    {/* ACTION */}
                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => void handleDelete(user._id)}
                        disabled={deletingId !== null}
                        aria-label={`Delete ${user.name}`}
                        className="rounded-lg border border-red-100 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === user._id
                          ? "Removing..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-600">
                      ♙
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      No team members found
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                      No members match your current search or role filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setRoleFilter("all");
                      }}
                      className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredUsers.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800">
                {totalMembers}
              </span>{" "}
              members
            </p>
            <p className="text-xs text-slate-400">
              Member information from your workspace database
            </p>
          </div>
        )}
      </section>
    </main>
  );
}