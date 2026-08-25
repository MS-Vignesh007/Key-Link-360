import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { ScreenId, UserProfile } from "../types";
import { screenToPath } from "../navigation";

interface ProfileMenuProps {
  user: UserProfile;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

export default function ProfileMenu({
  user,
  isOpen,
  onToggle,
  onClose,
  onLogout
}: ProfileMenuProps) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(user.name);
  const hasProfilePhoto = /^(data:image\/|https?:\/\/)/i.test(user.avatarUrl);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const handleMyAccount = () => {
    navigate(screenToPath(ScreenId.ACCOUNT));
    onClose();
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center hover:bg-white/5 p-1.5 rounded-lg transition-colors select-none"
        aria-label="Open profile menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="h-9 w-9 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-sans font-semibold text-sm flex items-center justify-center overflow-hidden">
          {hasProfilePhoto ? (
            <img
              src={user.avatarUrl}
              alt={`${user.name} profile`}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Profile menu"
          className="key-profile-menu absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="key-profile-menu__identity px-4 py-3.5">
            <p className="key-profile-menu__name text-sm font-bold truncate">{user.name}</p>
            <p className="key-profile-menu__email text-xs mt-0.5 truncate">{user.email}</p>
          </div>

          <div className="key-profile-menu__divide" />

          <button
            type="button"
            role="menuitem"
            onClick={handleMyAccount}
            className="key-profile-menu__item w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors"
          >
            <User className="h-4 w-4 shrink-0" />
            <span>My Account</span>
          </button>

          <div className="key-profile-menu__divide" />

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="key-profile-menu__item key-profile-menu__item--logout w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
