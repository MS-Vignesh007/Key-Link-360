import React from "react";
import { NavLink } from "react-router-dom";
import { ScreenId } from "../types";
import { User, ChevronLeft, ChevronRight } from "lucide-react";
import { NAV_CATEGORIES, NavItem, screenToPath } from "../navigation";
import KeyLogo3D from "./KeyLogo3D";

interface SidebarProps {
  currentScreen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

interface SidebarNavProps {
  currentScreen: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
  isCollapsed: boolean;
  setIsCollapsed?: (val: boolean) => void;
  showCollapse?: boolean;
  showBrand?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({
  currentScreen,
  onScreenChange,
  isCollapsed,
  setIsCollapsed,
  showCollapse = true,
  showBrand = true,
  onNavigate
}: SidebarNavProps) {
  const handleAccountClick = () => {
    onNavigate?.();
  };

  const renderItem = (item: NavItem) => {
    const IconComponent = item.icon;

    return (
      <NavLink
        key={item.id}
        to={screenToPath(item.id)}
        onClick={() => onNavigate?.()}
        className={({ isActive }) =>
          `key-sidebar-nav-item group relative ${
            isActive ? "key-nav-active" : "key-sidebar-nav-idle"
          }`
        }
        title={isCollapsed ? item.label : undefined}
      >
        {({ isActive }) => (
          <>
            <IconComponent className="key-sidebar-nav-item__icon" />

            {!isCollapsed && (
              <span className="key-sidebar-nav-item__label">{item.label}</span>
            )}

            {!isCollapsed && item.pro && (
              <span className="key-sidebar-pro-badge">PRO</span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {showBrand && (
        <div className={`key-sidebar-brand ${isCollapsed ? "justify-center" : ""}`}>
          <KeyLogo3D size="sm" showLabel={!isCollapsed} />
        </div>
      )}

      <div className="key-sidebar-nav__scroll">
        {NAV_CATEGORIES.map((category) => (
          <div key={category.title}>
            {!isCollapsed && (
              <p className="key-sidebar-category">{category.title}</p>
            )}
            <div className="key-sidebar-nav-items">{category.items.map(renderItem)}</div>
          </div>
        ))}
      </div>

      <div className="key-sidebar-footer">
        <NavLink
          to={screenToPath(ScreenId.ACCOUNT)}
          onClick={handleAccountClick}
          className={({ isActive }) =>
            `key-sidebar-nav-item group relative ${
              isActive ? "key-nav-active" : "key-sidebar-nav-idle"
            }`
          }
          title={isCollapsed ? "Account" : undefined}
        >
          {({ isActive }) => (
            <>
              <User className="key-sidebar-nav-item__icon" />
              {!isCollapsed && (
                <span className="key-sidebar-nav-item__label">Account</span>
              )}
            </>
          )}
        </NavLink>

        {showCollapse && setIsCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="key-sidebar-nav-item key-sidebar-nav-idle"
          >
            {isCollapsed ? (
              <ChevronRight className="key-sidebar-nav-item__icon" />
            ) : (
              <ChevronLeft className="key-sidebar-nav-item__icon" />
            )}
            {!isCollapsed && (
              <span className="key-sidebar-nav-item__label">Collapse</span>
            )}
          </button>
        )}
      </div>
    </>
  );
}

export default function Sidebar({
  currentScreen,
  onScreenChange,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  return (
    <aside
      className={`hidden lg:flex key-glass-sidebar flex-col transition-all duration-300 shrink-0 h-full max-h-full overflow-hidden ${
        isCollapsed ? "key-sidebar--collapsed w-[5.5rem]" : "w-[18rem]"
      }`}
      aria-label="Main navigation"
    >
      <SidebarNav
        currentScreen={currentScreen}
        onScreenChange={onScreenChange}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        showCollapse
      />
    </aside>
  );
}
