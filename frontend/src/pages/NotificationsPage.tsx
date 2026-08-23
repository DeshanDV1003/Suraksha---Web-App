import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { notificationService } from "../services/api";

const timeAgo = (date: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " min ago";
  return Math.floor(seconds) + " sec ago";
};

const typeColors: Record<string, { bg: string; text: string; dot: string }> = {
  ALERT:    { bg: "bg-red-100 dark:bg-red-900/30",    text: "text-red-600 dark:text-red-400",    dot: "bg-red-500" },
  WARNING:  { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  INFO:     { bg: "bg-blue-100 dark:bg-blue-900/30",  text: "text-blue-600 dark:text-blue-400",  dot: "bg-blue-500" },
  SUCCESS:  { bg: "bg-green-100 dark:bg-green-900/30",text: "text-green-600 dark:text-green-400",dot: "bg-green-500" },
};

const getTypeStyle = (type?: string) =>
  typeColors[type?.toUpperCase() ?? ""] ?? { bg: "bg-brand-100 dark:bg-brand-900/30", text: "text-brand-600 dark:text-brand-400", dot: "bg-brand-500" };

export default function NotificationsPage() {
  const { notifications, setNotifications, markAsRead } = useAppStore();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [markingAll, setMarkingAll] = useState(false);

  // Refresh on mount so the page always shows fresh data
  useEffect(() => {
    notificationService.getNotifications()
      .then(res => setNotifications(res.data))
      .catch(() => {});
  }, [setNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      markAsRead(id);
    } catch {/* silent */}
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    const unread = notifications.filter(n => !n.read);
    await Promise.allSettled(unread.map(n => notificationService.markAsRead(n.id)));
    unread.forEach(n => markAsRead(n.id));
    setMarkingAll(false);
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors disabled:opacity-50"
            >
              {markingAll ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              Mark all as read
            </button>
          )}
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit">
          {(["all", "unread", "read"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${
                filter === tab
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tab}
              {tab === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-orange-400 text-white rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Notification list ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications here</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {filter !== "all" ? `Try switching to "All"` : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif: any, index: number) => {
              const style = getTypeStyle(notif.type);
              return (
                <div
                  key={notif.id}
                  className={`relative flex gap-4 p-4 rounded-2xl border transition-all duration-200 group ${
                    !notif.read
                      ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
                      : "bg-gray-50/50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/50"
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Unread indicator */}
                  {!notif.read && (
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full ${style.dot}`} />
                  )}

                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${style.bg} ${style.text}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-snug ${!notif.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}>
                        {notif.title}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0 mt-0.5">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">System</span>
                      {notif.type && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                          <span className={`text-xs font-medium capitalize ${style.text}`}>
                            {notif.type.toLowerCase()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      title="Mark as read"
                      className="flex-shrink-0 self-center w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
