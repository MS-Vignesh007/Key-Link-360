import React, { useState } from "react";
import { AppNotification, ScreenId, UserProfile } from "../types";
import { Menu, Rocket } from "lucide-react";
import KeyLogo3D from "./KeyLogo3D";
import NotificationPanel from "./NotificationPanel";
import ProfileMenu from "./ProfileMenu";

interface HeaderProps {
  currentScreen: ScreenId;
  user: UserProfile;
  onScreenChange: (screen: ScreenId) => void;
  onMenuToggle?: () => void;
  isMobileNavOpen?: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNotificationNavigate?: (screen: ScreenId, pageId?: string) => void;
  onPublish?: () => void;
  onLogout: () => void;
}

export default function Header({
  currentScreen,
  user,
  onScreenChange,
  onMenuToggle,
  isMobileNavOpen = false,
  notifications,
  unreadCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNotificationNavigate,
  onPublish,
  onLogout
}: HeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const showPublish =
    currentScreen === ScreenId.DASHBOARD || currentScreen === ScreenId.ACCOUNT;

  return (
    <header className="key-app-navbar key-glass-header px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors shrink-0"
          aria-label="Open navigation menu"
          aria-expanded={isMobileNavOpen}
          aria-controls="mobile-nav-drawer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="lg:hidden min-w-0 flex items-center gap-2">
          <KeyLogo3D size="xs" />
          <p className="key-page-title text-base sm:text-lg truncate">
            KEYLINK360
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {showPublish && (
          <button
            type="button"
            onClick={onPublish}
            title="Go live and choose who can see your website"
            className="key-btn-chip"
          >
            <Rocket className="h-4 w-4" />
            <span className="hidden sm:inline">Publish</span>
          </button>
        )}

        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          isOpen={notificationsOpen}
          onToggle={() => {
            setProfileOpen(false);
            setNotificationsOpen((open) => !open);
          }}
          onClose={() => setNotificationsOpen(false)}
          onMarkRead={onMarkNotificationRead}
          onMarkAllRead={onMarkAllNotificationsRead}
          onNavigate={onNotificationNavigate || onScreenChange}
        />

        <ProfileMenu
          user={user}
          isOpen={profileOpen}
          onToggle={() => {
            setNotificationsOpen(false);
            setProfileOpen((open) => !open);
          }}
          onClose={() => setProfileOpen(false)}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
