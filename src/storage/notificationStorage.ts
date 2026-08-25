import { AppNotification, NotificationType, ScreenId } from "../types";

export const NOTIFICATIONS_STORAGE_KEY = "keylink360_notifications";
const MAX_NOTIFICATIONS = 50;

function readNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || localStorage.getItem("keyslink_notifications");
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifications: AppNotification[]): void {
  localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS))
  );
}

export function getAllNotifications(): AppNotification[] {
  return readNotifications();
}

export function getUnreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  targetScreen?: ScreenId;
  meta?: Record<string, string>;
}

export function createNotification(input: CreateNotificationInput): AppNotification {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: input.type,
    title: input.title,
    message: input.message,
    read: false,
    createdAt: new Date().toISOString(),
    targetScreen: input.targetScreen,
    meta: input.meta
  };
}

export function prependNotification(
  notifications: AppNotification[],
  input: CreateNotificationInput
): AppNotification[] {
  const next = [createNotification(input), ...notifications];
  writeNotifications(next);
  return next.slice(0, MAX_NOTIFICATIONS);
}

export function markNotificationRead(
  notifications: AppNotification[],
  id: string
): AppNotification[] {
  const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  writeNotifications(next);
  return next;
}

export function markAllNotificationsRead(notifications: AppNotification[]): AppNotification[] {
  const next = notifications.map((n) => ({ ...n, read: true }));
  writeNotifications(next);
  return next;
}

export function clearAllNotifications(): AppNotification[] {
  writeNotifications([]);
  return [];
}
