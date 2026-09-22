import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserProfile, ScreenId, HelpArticle } from "../types";
import {
  User,
  Palette,
  Languages,
  HelpCircle,
  Headphones,
  Sparkles,
  Check,
  Shield,
  Key,
  Download,
  Upload,
  LogOut,
  Moon,
  Sun,
  Zap,
  Crown,
  Flame,
  Terminal,
  Eye,
  Search,
  BookOpen,
  ArrowRight,
  Copy,
  MessageSquare,
  Mail,
  Phone,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  Lock
} from "lucide-react";
import PageShell from "./layout/PageShell";
import { AppTheme, ALL_THEMES, saveTheme } from "../lib/themeStorage";
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from "../lib/languageContext";
import { initialHelpArticles } from "../data";
import InteractiveSetupGuideModal from "./guides/InteractiveSetupGuideModal";
import ImageCropModal from "./ImageCropModal";
import BillingPlanSection from "./billing/BillingPlanSection";
import { changePasswordRequest } from "../lib/authApi";

export type SettingsTab = "account" | "personalization" | "language" | "help" | "support";

interface SettingsScreenProps {
  user?: UserProfile | null;
  theme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
  onUpdateUser?: (name: string, email: string, avatarUrl: string) => Promise<void> | void;
  onUpdateMfa?: (enabled: boolean) => void;
  onExportData?: () => void;
  onImportData?: (data: unknown) => boolean;
  onLogout?: () => void;
  onNavigate?: (screen: ScreenId) => void;
  initialTab?: SettingsTab;
  helpArticles?: HelpArticle[];
}

export default function SettingsScreen({
  user,
  theme = "light",
  onThemeChange = () => {},
  onUpdateUser = () => {},
  onUpdateMfa = () => {},
  onExportData = () => {},
  onImportData = () => false,
  onLogout = () => {},
  onNavigate,
  initialTab = "account",
  helpArticles = initialHelpArticles
}: SettingsScreenProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, setLanguage, currentLangMeta, t, formatBilingual } = useLanguage();

  // Tab State
  const tabParam = (searchParams.get("tab") as SettingsTab) || initialTab;
  const [activeTab, setActiveTab] = useState<SettingsTab>(tabParam);

  useEffect(() => {
    const currentParam = searchParams.get("tab") as SettingsTab;
    if (currentParam && ["account", "personalization", "language", "help", "support"].includes(currentParam)) {
      setActiveTab(currentParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: SettingsTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── 1. ACCOUNT STATES ──
  const [name, setName] = useState(user?.name || "Demo User");
  const [email, setEmail] = useState(user?.email || "user@example.com");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150");
  const [isUpdating, setIsUpdating] = useState(false);
  const [rawCropImage, setRawCropImage] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [isSavingMfa, setIsSavingMfa] = useState(false);
  const [backupCodes] = useState(() =>
    Array.from({ length: 6 }, () =>
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase()
    )
  );
  const [copiedBackup, setCopiedBackup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── 2. LANGUAGE TAB STATES ──
  const [langSearch, setLangSearch] = useState("");

  const filteredLanguages = useMemo(() => {
    const q = langSearch.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        (l.region && l.region.toLowerCase().includes(q))
    );
  }, [langSearch]);

  // ── 3. HELP CENTER STATES ──
  const [helpSearch, setHelpSearch] = useState("");
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // ── 4. SUPPORT TICKET STATES ──
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: "",
    category: "General Inquiry",
    message: ""
  });

  // Account Save handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdateUser(name, email, avatarUrl);
      triggerToast(t("common.saved", "Profile updated successfully!"));
    } catch {
      triggerToast("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setIsSavingPassword(true);
    try {
      await changePasswordRequest({ currentPassword, password: newPassword, confirmPassword });
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      triggerToast("Password changed successfully!");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const getThemeIcon = (id: AppTheme) => {
    switch (id) {
      case "eyevision":
        return <Eye className="h-4 w-4 text-amber-500" />;
      case "dark":
        return <Moon className="h-4 w-4 text-indigo-400" />;
      case "light":
        return <Sun className="h-4 w-4 text-amber-500" />;
      case "cyberpunk":
        return <Zap className="h-4 w-4 text-cyan-400" />;
      case "luxury":
        return <Crown className="h-4 w-4 text-amber-400" />;
      case "synthwave":
        return <Flame className="h-4 w-4 text-pink-400" />;
      case "matrix":
        return <Terminal className="h-4 w-4 text-emerald-400" />;
      default:
        return <Palette className="h-4 w-4 text-indigo-400" />;
    }
  };

  return (
    <PageShell className="font-sans text-[var(--key-text)]">
      
      {/* Top Header Banner */}
      <div className="bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-lg mb-6" data-aos="fade-up">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--key-text)] flex items-center gap-2.5">
                <span>{t("settings.title", "Settings & Preferences")}</span>
              </h2>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                {currentLangMeta.flag} {currentLangMeta.nativeName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--key-muted)]">
              {t("settings.subtitle", "Manage your profile, visual themes, world language, and customer support.")}
            </p>
          </div>

          {/* Quick Guide Launch Button */}
          <button
            type="button"
            onClick={() => setIsGuideModalOpen(true)}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📖 {language === "ta" ? "நேரடி செயல்முறை வழிகாட்டிகள்" : "Interactive Guides"}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--key-border)] pb-2 overflow-x-auto no-scrollbar mb-6">
        <button
          type="button"
          onClick={() => handleTabChange("account")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "account"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
              : "text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)]"
          }`}
        >
          <User className="h-4 w-4" />
          <span>{t("settings.tab_account", "Account")}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("personalization")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "personalization"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
              : "text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)]"
          }`}
        >
          <Palette className="h-4 w-4 text-pink-400" />
          <span>{t("settings.tab_personalization", "Personalization")}</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-bold uppercase">
            Themes
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("language")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "language"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
              : "text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)]"
          }`}
        >
          <Languages className="h-4 w-4 text-cyan-400" />
          <span>{t("settings.tab_language", "Language")}</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">
            {currentLangMeta.flag} {currentLangMeta.code.toUpperCase()}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("help")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "help"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
              : "text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)]"
          }`}
        >
          <HelpCircle className="h-4 w-4 text-emerald-400" />
          <span>{t("settings.tab_help", "Help Center")}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("support")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "support"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
              : "text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)]"
          }`}
        >
          <Headphones className="h-4 w-4 text-amber-400" />
          <span>{t("settings.tab_support", "Contact Support")}</span>
        </button>
      </div>

      {/* ===================== TAB 1: ACCOUNT ===================== */}
      {activeTab === "account" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Profile Form */}
            <div className="lg:col-span-8 bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--key-border)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--key-text)]">Profile Information</h3>
                    <p className="text-xs text-[var(--key-muted)]">Update your display name and email address.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Avatar Preview & Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={avatarUrl || user.avatarUrl}
                      alt={name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[var(--key-border)] bg-slate-900 shadow-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] border border-[var(--key-border)] text-xs font-bold text-[var(--key-text)] transition-colors cursor-pointer"
                    >
                      Change Avatar
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setRawCropImage(ev.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="text-[11px] text-[var(--key-muted)]">JPG, PNG or GIF up to 5MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--key-text)] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--key-text)] mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? t("common.loading", "Saving...") : t("common.save", "Save Changes")}
                  </button>
                </div>
              </form>
            </div>

            {/* Security & Access Side Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--key-border)]">
                  <Shield className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-[var(--key-text)]">Security & Authentication</h3>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full p-3 rounded-xl bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] border border-[var(--key-border)] text-left flex items-center justify-between text-xs font-bold text-[var(--key-text)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-amber-400" />
                      <span>Change Password</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--key-muted)]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMfaModal(true)}
                    className="w-full p-3 rounded-xl bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] border border-[var(--key-border)] text-left flex items-center justify-between text-xs font-bold text-[var(--key-text)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-400" />
                      <span>Two-Factor Auth (2FA)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      {user?.mfaEnabled ? "Enabled ✓" : "Setup"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Data Export & Backup */}
              <div className="bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--key-border)]">
                  <Download className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-[var(--key-text)]">Workspace Data</h3>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onExportData}
                    className="w-full py-2.5 rounded-xl bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] border border-[var(--key-border)] text-xs font-bold text-[var(--key-text)] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export JSON Backup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{t("common.logout", "Sign Out")}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Billing & Subscription Details */}
          <div className="mt-6">
            <BillingPlanSection userPlan={user?.plan || "free"} />
          </div>
        </div>
      )}

      {/* ===================== TAB 2: PERSONALIZATION ===================== */}
      {activeTab === "personalization" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--key-border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--key-text)]">Personalization Studio & Themes</h3>
                  <p className="text-xs text-[var(--key-muted)]">Choose how KEYLINK360 looks across your entire workspace.</p>
                </div>
              </div>
            </div>

            {/* Theme Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ALL_THEMES.map((th) => {
                const isSelected = theme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      saveTheme(th.id);
                      onThemeChange(th.id);
                      window.dispatchEvent(new CustomEvent("keylink360_theme_change", { detail: th.id }));
                      triggerToast(`Applied ${th.name} theme!`);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-500/20"
                        : "bg-[var(--key-surface)] border-[var(--key-border)] hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-[var(--key-surface-strong)] border border-[var(--key-border)]">
                        {getThemeIcon(th.id)}
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-[var(--key-text)]">{th.name}</h4>
                    <p className="text-[11px] text-[var(--key-muted)] mt-1">{th.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: LANGUAGE (TAMIL TOP 1ST) ===================== */}
      {activeTab === "language" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
            
            {/* Header with Active Language Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--key-border)] pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Languages className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--key-text)]">
                    World Language & Regional Localization
                  </h3>
                  <p className="text-xs text-[var(--key-muted)]">
                    Select your preferred language. The entire dashboard transforms to your chosen language.
                  </p>
                </div>
              </div>

              {/* Active Badge */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] self-start sm:self-auto">
                <span className="text-xl">{currentLangMeta.flag}</span>
                <div>
                  <div className="text-xs font-bold text-[var(--key-text)]">
                    {currentLangMeta.nativeName} ({currentLangMeta.name})
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold">Active Workspace Language ✓</div>
                </div>
              </div>
            </div>

            {/* Language Search Bar */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--key-muted)]" />
              <input
                type="search"
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                placeholder="Search languages (e.g. Tamil, English, Hindi, Spanish, French)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] text-xs text-[var(--key-text)] placeholder-[var(--key-muted)] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Language Cards Grid — TAMIL IS #1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredLanguages.map((lang, index) => {
                const isCurrent = language === lang.code;
                const isTamilFirst = lang.code === "ta";

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      triggerToast(`Switched language to ${lang.nativeName} (${lang.name})!`);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? "bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-500/20"
                        : "bg-[var(--key-surface)] border-[var(--key-border)] hover:border-slate-500 hover:bg-[var(--key-surface-hover)]"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl shrink-0">{lang.flag}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-[var(--key-text)] truncate flex items-center gap-1.5">
                          <span>{lang.nativeName}</span>
                          {isCurrent && <span className="text-indigo-400 text-xs">✓</span>}
                        </div>
                        <div className="text-[11px] text-[var(--key-muted)] truncate">{lang.name}</div>
                      </div>
                    </div>

                    {lang.region && (
                      <div className="text-[10px] text-[var(--key-muted)] font-mono truncate border-t border-[var(--key-border)]/50 pt-1.5 mt-1">
                        {lang.region}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* ===================== TAB 4: HELP CENTER ===================== */}
      {activeTab === "help" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--key-border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--key-text)]">
                    Help Center & Multilingual User Guides
                  </h3>
                  <p className="text-xs text-[var(--key-muted)]">
                    Step-by-step documentation with screenshots in English, தமிழ், and हिन्दी.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Launch Interactive Visual Guides</span>
              </button>
            </div>

            {/* Search Help Articles */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--key-muted)]" />
              <input
                type="search"
                value={helpSearch}
                onChange={(e) => setHelpSearch(e.target.value)}
                placeholder="Search tutorials, AI chatbot, WhatsApp API, DNS..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] text-xs text-[var(--key-text)] placeholder-[var(--key-muted)] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Articles List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialHelpArticles
                .filter(
                  (art) =>
                    !helpSearch ||
                    art.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
                    art.excerpt.toLowerCase().includes(helpSearch.toLowerCase())
                )
                .map((art) => (
                  <div
                    key={art.id}
                    className="p-4 rounded-2xl bg-[var(--key-surface)] border border-[var(--key-border)] space-y-2 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                        {art.category}
                      </span>
                      <span className="text-[10px] text-[var(--key-muted)]">{art.readTime}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[var(--key-text)] leading-snug">
                      {art.title}
                    </h4>
                    <p className="text-xs text-[var(--key-muted)] leading-relaxed">
                      {art.excerpt}
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setIsGuideModalOpen(true)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Step-by-Step Guide</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

      {/* ===================== TAB 5: CONTACT SUPPORT ===================== */}
      {activeTab === "support" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Support Ticket Form */}
            <div className="lg:col-span-7 bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-[var(--key-border)] pb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--key-text)]">24/7 Priority Support Ticket</h3>
                  <p className="text-xs text-[var(--key-muted)]">We usually respond within 15–30 minutes.</p>
                </div>
              </div>

              {supportSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--key-text)]">Ticket Submitted Successfully!</h4>
                  <p className="text-xs text-[var(--key-muted)] max-w-sm mx-auto">
                    Our technical support engineering team has received your message and will reply to <strong className="text-[var(--key-text)]">{user.email}</strong> shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSupportSubmitted(false)}
                    className="px-4 py-2 rounded-xl bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] text-xs font-bold text-[var(--key-text)] border border-[var(--key-border)]"
                  >
                    Submit Another Query
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSupportSubmitted(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-[var(--key-text)] mb-1">Issue Category</label>
                    <select
                      value={supportForm.category}
                      onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                    >
                      <option value="AI Chatbot & FAQs">AI Sales Chatbot & FAQs</option>
                      <option value="WhatsApp Cloud API">WhatsApp Cloud API & Webhooks</option>
                      <option value="WhatsApp QR Bot">WhatsApp QR Scanner Bot</option>
                      <option value="Custom Domains & SSL">Custom Domains & SSL Setup</option>
                      <option value="Payments & Razorpay">Razorpay & UPI Payments</option>
                      <option value="General Technical">General Technical Assistance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--key-text)] mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                      placeholder="Brief summary of your question..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--key-text)] mb-1">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={supportForm.message}
                      onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                      placeholder="Describe your issue in detail so we can help you fast..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Send Support Message →
                  </button>
                </form>
              )}
            </div>

            {/* Direct Official Contact Channels */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-[var(--key-text)] border-b border-[var(--key-border)] pb-2">
                  Official Channels
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-cyan-400" />
                      <div>
                        <div className="font-bold text-[var(--key-text)]">Email Support</div>
                        <div className="text-[11px] text-[var(--key-muted)]">support@keylink360.today</div>
                      </div>
                    </div>
                    <a
                      href="mailto:support@keylink360.today"
                      className="text-xs text-cyan-400 hover:underline font-bold"
                    >
                      Email Us →
                    </a>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="font-bold text-[var(--key-text)]">WhatsApp Support</div>
                        <div className="text-[11px] text-[var(--key-muted)]">Instant Chat Agent</div>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10">
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--key-border)] pb-3">
              <h4 className="text-base font-bold text-[var(--key-text)]">Change Password</h4>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-[var(--key-muted)] hover:text-[var(--key-text)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              {passwordError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  {passwordError}
                </div>
              )}
              <div>
                <label className="block font-bold text-[var(--key-text)] mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] text-xs text-[var(--key-text)]"
                />
              </div>
              <div>
                <label className="block font-bold text-[var(--key-text)] mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] text-xs text-[var(--key-text)]"
                />
              </div>
              <div>
                <label className="block font-bold text-[var(--key-text)] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--key-surface)] border border-[var(--key-border)] text-xs text-[var(--key-text)]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--key-surface)] text-[var(--key-muted)] hover:text-[var(--key-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  {isSavingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[var(--key-text)]">Sign Out of KeyLink360?</h4>
            <p className="text-xs text-[var(--key-muted)]">
              You will need to sign in again to access your dashboard and active links.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[var(--key-surface)] text-xs font-bold text-[var(--key-text)] border border-[var(--key-border)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {rawCropImage && (
        <ImageCropModal
          imageSrc={rawCropImage}
          isOpen={Boolean(rawCropImage)}
          onCropComplete={(croppedData) => {
            setAvatarUrl(croppedData);
            setRawCropImage(null);
            triggerToast("Avatar updated! Click 'Save Changes' to apply.");
          }}
          onClose={() => setRawCropImage(null)}
        />
      )}

      {/* Multi-Language Interactive Setup Guide Modal */}
      <InteractiveSetupGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        initialLanguage={language as any}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] bg-slate-900 text-white border border-slate-800 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

    </PageShell>
  );
}
