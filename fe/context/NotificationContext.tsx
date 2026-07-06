"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  autoHide: number; // ms, 0 = không auto-hide
}

interface NotificationContextValue {
  notify: (message: string, type?: NotificationType, autoHide?: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const idRef = useRef(0);

  const notify = useCallback((message: string, type: NotificationType = "info", autoHide = 4000) => {
    const id = ++idRef.current;
    setNotifications((prev) => [...prev, { id, type, message, autoHide }]);
  }, []);

  const remove = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {/* Toast container – fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {notifications.map((n) => (
          <ToastItem key={n.id} notification={n} onRemove={remove} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// ─── Toast Item ──────────────────────────────────────────
const typeStyles: Record<NotificationType, string> = {
  success:
    "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
  error:
    "bg-red-50 dark:bg-red-950/90 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300",
  warning:
    "bg-amber-50 dark:bg-amber-950/90 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300",
  info:
    "bg-blue-50 dark:bg-blue-950/90 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300",
};

const typeIcons: Record<NotificationType, string> = {
  success: "✓",
  error: "✗",
  warning: "⚠",
  info: "ℹ",
};

function ToastItem({
  notification,
  onRemove,
}: {
  notification: Notification;
  onRemove: (id: number) => void;
}) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss
  React.useEffect(() => {
    if (notification.autoHide > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onRemove(notification.id), 300);
      }, notification.autoHide);
      return () => clearTimeout(timer);
    }
  }, [notification, onRemove]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onRemove(notification.id), 300);
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-300 ${
        typeStyles[notification.type]
      } ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
    >
      <span className="text-base leading-none mt-0.5">{typeIcons[notification.type]}</span>
      <span className="flex-1">{notification.message}</span>
      <button
        onClick={handleDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-base leading-none cursor-pointer"
      >
        ×
      </button>
    </div>
  );
}
