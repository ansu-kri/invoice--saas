"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  LuChevronRight,
  LuChartNoAxesCombined,
  LuContactRound,
  LuBell,
  LuReceiptText,
  LuFileText,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuWalletCards,
  LuPlus,
  LuSearch,
  LuSettings,
  LuUserRound,
  LuUsers,
  LuUserPlus,
  LuX,
} from "react-icons/lu";
import { getNotifications } from "@/services/api";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LuLayoutDashboard },
  { label: "Invoices", href: "/invoices", icon: LuFileText },
  { label: "Customers", href: "/customers", icon: LuContactRound },
  { label: "Payments", href: "/payments", icon: LuWalletCards },
  { label: "Expenses", href: "/expenses", icon: LuReceiptText },
  { label: "Reports", href: "/reports", icon: LuChartNoAxesCombined },
  { label: "Notifications", href: "/notifications", icon: LuBell },
  { label: "Settings", href: "/settings", icon: LuSettings },
  { label: "My profile", href: "/profile", icon: LuUserRound },
  { label: "Team", href: "/user", icon: LuUsers },
  { label: "Add team member", href: "/createuser", icon: LuUserPlus },
];

export default function Navbar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState<{ name?: string; role?: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const syncAccount = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setAccount(JSON.parse(stored) as { name?: string; role?: string });
          return;
        }
        const token = localStorage.getItem("token");
        const encodedPayload = token?.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
        setAccount(encodedPayload
          ? JSON.parse(atob(encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, "="))) as { name?: string; role?: string }
          : null);
      } catch {
        setAccount(null);
      }
    };
    const timer = window.setTimeout(syncAccount, 0);
    window.addEventListener("invoice-auth-change", syncAccount);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("invoice-auth-change", syncAccount);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshNotifications = () => {
      void Promise.resolve().then(async () => {
        if (!localStorage.getItem("token")) {
          if (active) setUnreadCount(0);
          return;
        }
        try {
          const result = await getNotifications();
          if (active) setUnreadCount(result.unreadCount);
        } catch (error) {
          console.error("Could not load notification count:", error);
        }
      });
    };
    refreshNotifications();
    window.addEventListener("invoice-auth-change", refreshNotifications);
    return () => {
      active = false;
      window.removeEventListener("invoice-auth-change", refreshNotifications);
    };
  }, [pathname]);

  if (isAuthPage) return <>{children}</>;

  const pageTitle =
    pathname === "/dashboard"
      ? "Overview"
      : pathname === "/invoices/new"
        ? "Create invoice"
        : pathname.startsWith("/invoices")
          ? "Invoices"
        : pathname === "/payments"
          ? "Payments"
          : pathname === "/expenses"
            ? "Expenses"
            : pathname === "/notifications"
              ? "Notifications"
          : pathname === "/reports"
          ? "Reports & analytics"
          : pathname.startsWith("/customers")
          ? "Customers"
          : pathname === "/createuser"
            ? "Add team member"
            : pathname === "/settings"
              ? "Settings"
              : pathname === "/profile"
                ? "My profile"
            : pathname === "/user"
              ? "Team"
              : "Workspace";

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/invoices?search=${encodeURIComponent(search.trim())}`);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("invoice-auth-change"));
    router.push("/login");
  };

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`app-sidebar ${collapsed ? "app-sidebar-collapsed" : ""} ${mobileOpen ? "app-sidebar-mobile-open" : ""}`}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">i</div>
          {!collapsed && (
            <div className="brand-copy">
              <span className="brand-name">Invoice SaaS</span>
              <span className="brand-caption">FINANCE WORKSPACE</span>
            </div>
          )}
          <button
            className="sidebar-icon-button mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <LuX />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">W</div>
          {!collapsed && (
            <>
              <div className="workspace-copy">
                <span>Workspace</span>
                <small>Business account</small>
              </div>
              <LuChevronRight className="workspace-chevron" />
            </>
          )}
        </div>

        <div className="nav-section-label">{!collapsed && "WORKSPACE"}</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.filter(({ href }) =>
            (href !== "/user" && href !== "/createuser" && href !== "/settings") || account?.role === "admin"
          ).map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href ||
              (href === "/invoices" && pathname.startsWith("/invoices"));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
              >
                <Icon aria-hidden="true" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
          <Link
            href="/invoices/new"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Create invoice" : undefined}
            className={`sidebar-link ${pathname === "/invoices/new" ? "sidebar-link-active" : ""}`}
          >
            <LuPlus aria-hidden="true" />
            {!collapsed && <span>Create invoice</span>}
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">U</div>
            {!collapsed && (
              <div className="user-copy">
                <span>{account?.name || "Your account"}</span>
                <small>Invoice workspace</small>
              </div>
            )}
            <button
              className="sidebar-icon-button logout-button"
              aria-label="Log out"
              title="Log out"
              onClick={handleLogout}
            >
              <LuLogOut />
            </button>
          </div>
          <button
            className="collapse-button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
            {!collapsed && <span>Collapse menu</span>}
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-heading">
            <button
              className="mobile-menu-button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <LuMenu />
            </button>
            <div className="breadcrumbs">
              <span>Workspace</span>
              <LuChevronRight aria-hidden="true" />
              <strong>{pageTitle}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <form className="global-search" onSubmit={handleSearch} role="search">
              <LuSearch aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoices..."
                aria-label="Search invoices"
              />
              <kbd>↵</kbd>
            </form>
            <Link href="/invoices/new" onClick={() => setMobileOpen(false)} className="topbar-create">
              <LuPlus aria-hidden="true" />
              <span>New invoice</span>
            </Link>
            <Link
              href="/notifications"
              className="topbar-notifications"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              title="Notifications"
            >
              <LuBell aria-hidden="true" />
              {unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </Link>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
