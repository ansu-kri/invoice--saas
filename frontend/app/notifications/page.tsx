"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationRecord,
} from "@/services/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNotifications(page);
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markRead = async (notification: NotificationRecord) => {
    if (notification.readAt) return;
    try {
      await markNotificationRead(notification._id);
      window.dispatchEvent(new Event("invoice-auth-change"));
      await loadNotifications();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update notification.");
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      window.dispatchEvent(new Event("invoice-auth-change"));
      await loadNotifications();
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update notifications.");
    }
  };

  return (
    <div className="module-page">
      <div className="module-heading">
        <div><span className="eyebrow">WORKSPACE ACTIVITY</span><h1>Notifications</h1><p>Invoice and captured-payment updates for your organization.</p></div>
        <button className="module-secondary-action" onClick={() => void markAllRead()} disabled={!unreadCount}>Mark all as read</button>
      </div>
      <section className="module-table-panel notification-panel">
        <div className="module-table-heading"><div><h2>Recent activity</h2><p>{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}</p></div></div>
        {loading ? <div className="table-skeleton" />
          : notifications.length ? (
            <ul className="notification-list">
              {notifications.map((notification) => (
                <li key={notification._id} className={notification.readAt ? "" : "notification-unread"}>
                  <span className={`notification-type notification-type-${notification.type}`} aria-hidden="true" />
                  <div className="notification-copy">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time>
                  </div>
                  <div className="notification-actions">
                    {!notification.readAt && <button onClick={() => void markRead(notification)}>Mark read</button>}
                    {notification.href && <Link href={notification.href} onClick={() => void markRead(notification)}>View</Link>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="module-empty"><strong>You’re all caught up</strong><span>Invoice and payment events will appear here.</span></div>
          )}
        {!loading && totalPages > 1 && (
          <div className="module-pagination">
            <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        )}
      </section>
    </div>
  );
}
