import React, { useEffect, useRef, useState } from "react";
import { AppNotification, NotificationStatus, NotificationStage, ScreenId } from "../types";
import {
  Bell,
  CheckCheck,
  X,
  CheckCircle2,
  Clock,
  Hourglass,
  XCircle,
  Loader2,
  ArrowRightCircle,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Filter,
  Sparkles,
  Layers,
  Globe
} from "lucide-react";

interface NotificationPanelProps {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification?: (id: string) => void;
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

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_CONFIGS: Record<NotificationStatus, StatusConfig> = {
  completed: {
    label: "Completed",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    icon: CheckCircle2
  },
  delivered: {
    label: "Delivered",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800/60",
    icon: CheckCheck
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
    icon: Clock
  },
  waiting: {
    label: "Waiting",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800/60",
    icon: Hourglass
  },
  awaiting: {
    label: "Awaiting",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800/60",
    icon: Clock
  },
  processing: {
    label: "Processing",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800/60",
    icon: Loader2
  },
  loading: {
    label: "Loading",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800/60",
    icon: Loader2
  },
  proceed: {
    label: "Proceed",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800/60",
    icon: ArrowRightCircle
  },
  upcoming: {
    label: "Upcoming",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/60",
    icon: Calendar
  },
  canceled: {
    label: "Canceled",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
    icon: XCircle
  },
  missing: {
    label: "Missing",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800/60",
    icon: AlertTriangle
  }
};

const STAGE_LABELS: Record<NotificationStage, string> = {
  before_build: "Before Build",
  building: "Building Site",
  after_publish: "After Published",
  workspace_activity: "Workspace"
};

type FilterCategory = "all" | "lifecycle" | "pending" | "workspace";

export default function NotificationPanel({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onNavigate
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterCategory>("all");

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

  // Filter items based on active tab
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "lifecycle") {
      return (
        n.stage === "before_build" ||
        n.stage === "building" ||
        n.stage === "after_publish" ||
        n.type === "page_published" ||
        n.type === "draft_saved"
      );
    }
    if (filter === "pending") {
      return (
        n.status === "pending" ||
        n.status === "waiting" ||
        n.status === "awaiting" ||
        n.status === "missing" ||
        n.status === "processing"
      );
    }
    if (filter === "workspace") {
      return (
        n.stage === "workspace_activity" ||
        n.type === "domain_updated" ||
        n.type === "contact_added" ||
        n.type === "qr_generated" ||
        n.type === "pixel_added" ||
        n.type === "campaign_status"
      );
    }
    return true;
  });

  // Calculate live count summaries
  const deliveredCount = notifications.filter(
    (n) => n.status === "delivered" || n.status === "completed"
  ).length;
  const pendingCount = notifications.filter(
    (n) =>
      n.status === "pending" ||
      n.status === "waiting" ||
      n.status === "awaiting" ||
      n.status === "processing" ||
      n.status === "missing"
  ).length;

  return (
    <div className="relative shrink-0" ref={panelRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={onToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Workspace & Site Lifecycle Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[19px] h-[19px] px-1 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 text-[10px] font-extrabold text-white flex items-center justify-center leading-none shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Panel Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[min(26rem,calc(100vw-1.5rem))] key-notification-panel rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md shrink-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Notifications & Activity</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded-md">
                      Live
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}` : "All workspace actions synced"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Activity Metrics Summary Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Live / Delivered ({deliveredCount})</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Pending / Waiting ({pendingCount})</span>
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/80 p-1 rounded-xl">
              {[
                { id: "all" as const, label: "All" },
                { id: "lifecycle" as const, label: "🚀 Sites Lifecycle" },
                { id: "pending" as const, label: "⏳ Pending" },
                { id: "workspace" as const, label: "⚡ Workspace" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[10.5px] font-bold text-center transition-all cursor-pointer truncate ${
                    filter === tab.id
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Scrollable List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 no-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  No notifications in this tab
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Build sites, save drafts, publish pages, and receive leads to see truthful real-time updates here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredNotifications.map((n) => {
                  const statusConfig = STATUS_CONFIGS[n.status || "completed"] || STATUS_CONFIGS.completed;
                  const StatusIcon = statusConfig.icon;
                  const isProcessing = n.status === "processing" || n.status === "loading";

                  return (
                    <li key={n.id} className="relative group">
                      <div
                        onClick={() => handleItemClick(n)}
                        className={`w-full text-left p-3.5 transition-all cursor-pointer flex flex-col gap-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                          !n.read ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                        }`}
                      >
                        {/* Top Meta Bar: Status Badge + Stage + Time + Delete */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Status Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wide border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                            >
                              <StatusIcon className={`h-3 w-3 shrink-0 ${isProcessing ? "animate-spin" : ""}`} />
                              <span>{statusConfig.label}</span>
                            </span>

                            {/* Lifecycle Stage Chip */}
                            {n.stage && (
                              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {STAGE_LABELS[n.stage] || n.stage}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!n.read && (
                              <span
                                className="h-2 w-2 rounded-full bg-indigo-500 shrink-0"
                                title="Unread"
                              />
                            )}
                            <span className="text-[10px] text-slate-400 font-medium font-mono">
                              {formatTime(n.createdAt)}
                            </span>
                            {onDeleteNotification && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNotification(n.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity ml-1"
                                title="Delete notification"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Detailed Message */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            {n.title}
                          </h4>
                          <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                        </div>

                        {/* Bottom Action Pill Button */}
                        {n.actionLabel && (
                          <div className="pt-1 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold border border-indigo-500/20 transition-colors">
                              <span>{n.actionLabel}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">Click to open</span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
            <span>KeyLink360 Real-Time Truth Engine</span>
            <span>{notifications.length} total</span>
          </div>
        </div>
      )}
    </div>
  );
}
