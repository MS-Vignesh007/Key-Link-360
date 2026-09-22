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
import { useLanguage } from "../lib/languageContext";
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
  const { t, language } = useLanguage();

  const getTranslatedLabel = (item: NavItem) => {
    switch (item.id) {
      case ScreenId.DASHBOARD:
        return t("nav.dashboard", "Dashboard");
      case ScreenId.BIO_PAGES:
        return t("nav.bio_pages", "Bio Pages");
      case ScreenId.CONTACTS:
        return t("nav.contacts", "Contacts");
      case ScreenId.WHATSAPP:
        return t("nav.whatsapp", "WhatsApp");
      case ScreenId.LINKS:
        return t("nav.links", "Links");
      case ScreenId.LINK_ROTATOR:
        return t("nav.link_rotator", "Link Rotator");
      case ScreenId.QR_CODES:
        return t("nav.qr_codes", "QR Codes");
      case ScreenId.TEMPLATES:
        return t("nav.templates", "Templates");
      case ScreenId.INTEGRATIONS:
        return t("nav.integrations", "Integrations");
      case ScreenId.PIXELS:
        return t("nav.pixels", "Pixels");
      case ScreenId.MEDIA_LIBRARY:
        return t("nav.media_library", "Media Library");
      case ScreenId.CUSTOM_DOMAINS:
        return t("nav.custom_domains", "Custom Domains");
      case ScreenId.SETTINGS:
        return t("nav.settings", "Settings");
      case ScreenId.SUPER_ADMIN:
        return t("nav.control_center", "Control Center");
      default:
        return item.label;
    }
  };

  const getTranslatedCategory = (title: string) => {
    if (title === "Smart Marketing") return t("cat.smart_marketing", "Smart Marketing");
    if (title.includes("Tools")) return t("cat.tools", "Tools & Settings");
    return title;
  };

  const renderItem = (item: NavItem) => {
    const IconComponent = item.icon;
    const itemPath = screenToPath(item.id);
    const isActive = location.pathname === itemPath;
    const labelText = getTranslatedLabel(item);

    return (
      <li key={item.id} className={isActive ? "active" : ""}>
        <NavLink
          to={itemPath}
          onClick={() => {
            onNavigate?.();
            if (isCollapsed && setIsCollapsed) {
              setIsCollapsed(false);
            }
            // Instantly scroll workspace to top on every navigation click
            const mainContainer =
              (document.getElementById("key-main-scroll-container") as HTMLElement | null) ||
              (document.querySelector(".key-main-scroll") as HTMLElement | null);
            if (mainContainer) {
              mainContainer.scrollTop = 0;
              mainContainer.scrollLeft = 0;
            }
            window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
          }}
          className={isActive ? "active" : ""}
          title={isCollapsed ? labelText : undefined}
        >
          <span className="icon-box">
            <IconComponent className="key-sidebar-nav-item__icon" />
          </span>

          <span className="nav-title">
            <span className="truncate">{labelText}</span>
            {item.pro && <span className="key-sidebar-pro-badge">PRO</span>}
          </span>
        </NavLink>
      </li>
    );
  };

  return (
    <>
      {showBrand && (
        <div
          className="key-sidebar-brand shrink-0 cursor-pointer"
          onClick={() => {
            if (isCollapsed && setIsCollapsed) {
              setIsCollapsed(false);
            }
          }}
        >
          <KeyLogo3D size="sm" showLabel textClassName="text-xl font-black" />
        </div>
      )}

      <div className="key-sidebar-nav__scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {user?.role === "MAIN_OWNER" && (
          <div className="mb-2">
            <div className="key-sidebar-category-wrap">
              <p className="key-sidebar-category-text text-amber-400 font-bold">
                {t("cat.platform_owner", "Platform Owner")}
              </p>
            </div>
            <ul>{renderItem(ADMIN_NAV_ITEM)}</ul>
          </div>
        )}

        {NAV_CATEGORIES.map((category, index) => (
          <div key={category.title} className="mb-2">
            <div className="key-sidebar-category-wrap">
              {index > 0 && <span className="key-sidebar-category-line" aria-hidden="true" />}
              <p className="key-sidebar-category-text">{getTranslatedCategory(category.title)}</p>
            </div>
            <ul>{category.items.map(renderItem)}</ul>
          </div>
        ))}

        {showCollapse && setIsCollapsed && (
          <div className="mt-4 pt-2 border-t border-[var(--key-border)]/50">
            <ul>
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
            </ul>
          </div>
        )}
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
        isCollapsed ? "key-sidebar--collapsed cursor-pointer" : ""
      }`}
      aria-label="Main navigation"
      onClick={() => {
        if (isCollapsed) {
          setIsCollapsed(false);
        }
      }}
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

