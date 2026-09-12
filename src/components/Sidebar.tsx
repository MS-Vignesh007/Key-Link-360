import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  User,
  ChevronLeft,
  ChevronRight,
  Palette,
  Sparkles,
} from "lucide-react";
import { NAV_CATEGORIES, NavItem, ADMIN_NAV_ITEM, screenToPath } from "../navigation";
import { UserProfile, ScreenId } from "../types";
import { AppTheme } from "../lib/themeStorage";
import KeyLogo3D from "./KeyLogo3D";
import PersonalizationModal from "./PersonalizationModal";

interface SidebarProps {
  currentScreen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  user?: UserProfile | null;
  theme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
}

interface SidebarNavProps {
  currentScreen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
  isCollapsed: boolean;
  setIsCollapsed?: (val: boolean) => void;
  showCollapse?: boolean;
  showBrand?: boolean;
  onNavigate?: () => void;
  user?: UserProfile | null;
  theme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
}

export function SidebarNav({
  currentScreen,
  onScreenChange,
  isCollapsed,
  setIsCollapsed,
  showCollapse = true,
  showBrand = true,
  onNavigate,
  user,
  theme = "light",
  onThemeChange,
}: SidebarNavProps) {
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const location = useLocation();

  const handleAccountClick = () => {
    onNavigate?.();
  };

  const renderItem = (item: NavItem) => {
    const IconComponent = item.icon;
    const itemPath = screenToPath(item.id);
    const isActive = location.pathname === itemPath;

    return (
      <li key={item.id} className={isActive ? "active" : ""}>
        <NavLink
          to={itemPath}
          onClick={() => onNavigate?.()}
          className={isActive ? "active" : ""}
          title={isCollapsed ? item.label : undefined}
        >
          <span className="icon-box">
            <IconComponent className="key-sidebar-nav-item__icon" />
          </span>

          <span className="nav-title">
            <span>{item.label}</span>
            {item.pro && <span className="key-sidebar-pro-badge">PRO</span>}
          </span>
        </NavLink>
      </li>
    );
  };

  const isAccountActive = location.pathname === screenToPath(ScreenId.ACCOUNT);

  return (
    <>
      {showBrand && (
        <div className="key-sidebar-brand shrink-0">
          <KeyLogo3D size="sm" showLabel />
        </div>
      )}

      <div className="key-sidebar-nav__scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {user?.role === "MAIN_OWNER" && (
          <div className="mb-2">
            <div className="key-sidebar-category-wrap">
              <p className="key-sidebar-category-text text-amber-400 font-bold">
                Platform Owner
              </p>
            </div>
            <ul>{renderItem(ADMIN_NAV_ITEM)}</ul>
          </div>
        )}

        {NAV_CATEGORIES.map((category, index) => (
          <div key={category.title} className="mb-2">
            <div className="key-sidebar-category-wrap">
              {index > 0 && <span className="key-sidebar-category-line" aria-hidden="true" />}
              <p className="key-sidebar-category-text">{category.title}</p>
            </div>
            <ul>{category.items.map(renderItem)}</ul>
          </div>
        ))}

        <div className="mb-2">
          <div className="key-sidebar-category-wrap">
            <span className="key-sidebar-category-line" aria-hidden="true" />
            <p className="key-sidebar-category-text">Account & Preferences</p>
          </div>
          <ul>
            <li className={isAccountActive ? "active" : ""}>
              <NavLink
                to={screenToPath(ScreenId.ACCOUNT)}
                onClick={handleAccountClick}
                className={isAccountActive ? "active" : ""}
                title={isCollapsed ? "Account" : undefined}
              >
                <span className="icon-box">
                  <User className="key-sidebar-nav-item__icon" />
                </span>
                <span className="nav-title">
                  <span>Account</span>
                </span>
              </NavLink>
            </li>

            {/* Personalization Trigger Button */}
            <li>
              <button
                type="button"
                onClick={() => setIsStudioModalOpen(true)}
                title={isCollapsed ? "Personalization Studio & Themes" : undefined}
              >
                <span className="icon-box">
                  <Palette className="key-sidebar-nav-item__icon text-pink-500 group-hover:text-pink-400 transition-transform group-hover:scale-110" />
                </span>
                <span className="nav-title">
                  <span className="font-medium flex-1">Personalization</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    {theme}
                  </span>
                </span>
              </button>
            </li>

            {showCollapse && setIsCollapsed && (
              <li>
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  <span className="icon-box">
                    {isCollapsed ? (
                      <ChevronRight className="key-sidebar-nav-item__icon" />
                    ) : (
                      <ChevronLeft className="key-sidebar-nav-item__icon" />
                    )}
                  </span>
                  <span className="nav-title">
                    <span>{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</span>
                  </span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Dedicated Personalization Studio Modal */}
      <PersonalizationModal
        isOpen={isStudioModalOpen}
        onClose={() => setIsStudioModalOpen(false)}
        currentTheme={theme}
        onThemeChange={(newTheme) => {
          onThemeChange?.(newTheme);
        }}
      />
    </>
  );
}

export default function Sidebar({
  currentScreen,
  onScreenChange,
  isCollapsed,
  setIsCollapsed,
  user,
  theme,
  onThemeChange,
}: SidebarProps) {
  return (
    <aside
      className={`hidden lg:flex codepen-sidebar key-glass-sidebar h-screen max-h-screen shrink-0 ${
        isCollapsed ? "key-sidebar--collapsed" : ""
      }`}
      aria-label="Main navigation"
    >
      <SidebarNav
        currentScreen={currentScreen}
        onScreenChange={onScreenChange}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        showCollapse
        user={user}
        theme={theme}
        onThemeChange={onThemeChange}
      />
    </aside>
  );
}

