import React, { useEffect, useRef, useState } from "react";
import { AppNotification, ScreenId } from "../types";
import { Bell, CheckCheck, X } from "lucide-react";

interface NotificationPanelProps {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (screen: ScreenId, pageId?: string) => void;
}

function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function NotificationPanel({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onNavigate
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleItemClick = (notification: AppNotification) => {
    onMarkRead(notification.id);
    if (notification.targetScreen) {
      onNavigate(notification.targetScreen, notification.meta?.pageId);
      onClose();
    }
  };

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        type="button"
        onClick={onToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 border-2 border-white text-[9px] font-bold text-white flex items-center justify-center leading-none shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] key-notification-panel rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b key-notification-panel__header">
            <div>
              <h3 className="text-sm font-bold key-notification-panel__title">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-[10px] key-notification-panel__sub">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="p-1.5 key-notification-panel__action rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 key-notification-panel__action rounded-lg transition-colors"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 px-6 text-center">
                <Bell className="h-8 w-8 key-notification-panel__empty-icon mx-auto mb-2" />
                <p className="text-sm font-semibold key-notification-panel__title">No notifications yet</p>
                <p className="text-xs key-notification-panel__sub mt-1">
                  Publish pages, save drafts, and capture leads to see updates here.
                </p>
              </div>
            ) : (
              <ul className="divide-y key-notification-panel__divide">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(notification)}
                      className={`w-full text-left px-4 py-3 key-notification-panel__item transition-colors ${
                        !notification.read ? "key-notification-panel__item--unread" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                        )}
                        <div className={`min-w-0 flex-1 ${notification.read ? "pl-4" : ""}`}>
                          <p className="text-sm font-semibold key-notification-panel__title leading-snug">
                            {notification.title}
                          </p>
                          <p className="text-xs key-notification-panel__sub mt-0.5 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-[10px] key-notification-panel__meta mt-1 font-mono">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
