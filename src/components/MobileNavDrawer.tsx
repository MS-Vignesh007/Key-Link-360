import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import KeyLogo3D from "./KeyLogo3D";
import { ScreenId } from "../types";
import { SidebarNav } from "./Sidebar";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  currentScreen,
  onScreenChange
}: MobileNavDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleScreenChange = (screen: ScreenId) => {
    onScreenChange(screen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        aria-label="Close navigation menu"
        onClick={onClose}
      />

      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="absolute inset-y-0 left-0 w-[min(20rem,85vw)] max-w-full key-glass-sidebar shadow-xl flex flex-col animate-in slide-in-from-left duration-300"
      >
        <div className="key-sidebar-brand justify-between w-full">
          <KeyLogo3D size="sm" showLabel />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <SidebarNav
            currentScreen={currentScreen}
            onScreenChange={handleScreenChange}
            isCollapsed={false}
            showBrand={false}
            showCollapse={false}
          />
        </div>
      </div>
    </div>
  );
}
