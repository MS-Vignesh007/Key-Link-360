import React, { useEffect, useRef, useState } from "react";
import { UserProfile, ScreenId } from "../types";
import {
  User,
  CheckCircle,
  Key,
  RefreshCw,
  Download,
  Upload,
  Database,
  FileJson,
  AlertTriangle,
  Info,
  LogOut,
  X,
  Shield,
  BadgeCheck,
  Copy,
  Check,
  Palette,
  Moon,
  Sun
} from "lucide-react";
import PageShell from "./layout/PageShell";
import type { AppTheme } from "../lib/themeStorage";
import { KEYS_AVATAR_PRESETS } from "../lib/avatarPresets";
import BillingPlanSection from "./billing/BillingPlanSection";

interface AccountScreenProps {
  user: UserProfile;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onUpdateUser: (name: string, email: string, avatarUrl: string) => void;
  onUpdateMfa: (enabled: boolean) => void;
  onExportData: () => void;
  onImportData: (data: unknown) => boolean;
  onLogout: () => void;
  onNavigate?: (screen: ScreenId) => void;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function AccountScreen({
  user,
  theme,
  onThemeChange,
  onUpdateUser,
  onUpdateMfa,
  onExportData,
  onImportData,
  onLogout,
  onNavigate
}: AccountScreenProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [success, setSuccess] = useState(false);

  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pendingImport, setPendingImport] = useState<unknown | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
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
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setAvatarUrl(user.avatarUrl);
  }, [user.name, user.email, user.avatarUrl]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const profileInitials =
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";
  const hasProfilePhoto = /^(data:image\/|https?:\/\/)/i.test(avatarUrl);
  const isDirty =
    name.trim() !== user.name ||
    email.trim() !== user.email ||
    avatarUrl !== user.avatarUrl;

  const handleUpdate = (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setProfileError("Full name is required.");
      return;
    }
    if (trimmedName.length < 2) {
      setProfileError("Name must be at least 2 characters.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setProfileError("Enter a valid email address.");
      return;
    }

    setIsUpdating(true);
    window.setTimeout(() => {
      onUpdateUser(trimmedName, trimmedEmail, avatarUrl);
      setIsUpdating(false);
      setSuccess(true);
      triggerToast("Profile saved successfully.");
      window.setTimeout(() => setSuccess(false), 2500);
    }, 500);
  };

  const handleResetProfile = () => {
    setName(user.name);
    setEmail(user.email);
    setAvatarUrl(user.avatarUrl);
    setProfileError("");
    setAvatarError("");
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose a valid image file.");
      return;
    }
    if (file.size > 1_000_000) {
      setAvatarError("Profile image must be smaller than 1 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(String(reader.result || ""));
      setAvatarError("");
    };
    reader.onerror = () => setAvatarError("Could not read that image. Try another file.");
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const applyImport = (parsed: unknown) => {
    setImportStatus("loading");
    setErrorMessage("");
    window.setTimeout(() => {
      const successResult = onImportData(parsed);
      if (successResult) {
        setImportStatus("success");
        triggerToast("Workspace restored from backup.");
      } else {
        setImportStatus("error");
        setErrorMessage("Invalid schema detected. This file is missing required KEYLINK360 metadata.");
      }
      setPendingImport(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 700);
  };

  const processImportFile = (file: File) => {
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setImportStatus("error");
      setErrorMessage("Unsupported file type. Please select a valid KEYLINK360 backup (.json) file.");
      return;
    }

    setImportStatus("loading");
    setErrorMessage("");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || "");
        const parsed = JSON.parse(text);
        setImportStatus("idle");
        setPendingImport(parsed);
      } catch {
        setImportStatus("error");
        setErrorMessage("Malformed JSON syntax. Could not parse this backup file.");
      }
    };
    reader.onerror = () => {
      setImportStatus("error");
      setErrorMessage("Failed to read the file. Please try again.");
    };
    reader.readAsText(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processImportFile(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processImportFile(file);
  };

  const handleExport = () => {
    setIsExporting(true);
    window.setTimeout(() => {
      onExportData();
      setIsExporting(false);
      triggerToast("Backup JSON downloaded.");
    }, 250);
  };

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");

    if (!currentPassword.trim()) {
      setPasswordError("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError("New password must include letters and numbers.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from the current password.");
      return;
    }

    setIsSavingPassword(true);
    window.setTimeout(() => {
      setIsSavingPassword(false);
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      triggerToast("Password updated successfully.");
    }, 500);
  };

  const disableMfa = () => {
    setIsSavingMfa(true);
    window.setTimeout(() => {
      onUpdateMfa(false);
      setIsSavingMfa(false);
      setShowMfaModal(false);
      setMfaCode("");
      triggerToast("Two-factor authentication disabled.");
    }, 400);
  };

  const handleMfaSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setMfaError("");

    if (!/^\d{6}$/.test(mfaCode.trim())) {
      setMfaError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setIsSavingMfa(true);
    window.setTimeout(() => {
      onUpdateMfa(true);
      setIsSavingMfa(false);
      setShowMfaModal(false);
      setMfaCode("");
      triggerToast("Two-factor authentication enabled.");
    }, 500);
  };

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopiedBackup(true);
      triggerToast("Backup codes copied.");
      window.setTimeout(() => setCopiedBackup(false), 1500);
    } catch {
      triggerToast("Could not copy backup codes.");
    }
  };

  return (
    <PageShell className="max-w-5xl pb-20">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pr-28 sm:pr-32">
        <div className="min-w-0">
          <h2 className="key-page-title text-2xl sm:text-3xl">
            Account Settings
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage workspace plans, user credentials, and full-database backups.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowLogoutConfirm(true)}
        className="key-logout-fixed"
        aria-label="Log out of your account"
      >
        <LogOut className="h-4 w-4" />
        <span>Log Out</span>
      </button>

      <div className="max-w-3xl space-y-6">
        <div className="key-section-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current plan</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <h3 className="font-display font-bold text-lg text-slate-900">{user.plan || "Free Plan"}</h3>
              {user.isVerified && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
              {user.mfaEnabled && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Shield className="h-3.5 w-3.5" />
                  MFA on
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Signed in as {user.email}</p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(ScreenId.CONTACT_SUPPORT)}
              className="shrink-0 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Contact support about upgrades
            </button>
          )}
        </div>

        <BillingPlanSection />

        <div className="key-section-card p-4 sm:p-6 space-y-6">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <Palette className="h-5 w-5 text-indigo-400" />
            Themes
          </h3>
          <p className="text-sm key-page-subtitle">
            Pick how KEYLINK360 looks for you. Your choice is saved on this device.
          </p>
          <div className="key-theme-picker">
            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => onThemeChange("dark")}
              className="key-theme-option"
            >
              <span className="key-theme-option__swatch key-theme-option__swatch--dark" aria-hidden />
              <span className="flex items-center gap-1.5 key-theme-option__label">
                <Moon className="h-4 w-4" />
                Dark Mode
              </span>
              <span className="key-theme-option__hint">Deep glass + colorful glow (default)</span>
            </button>
            <button
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => onThemeChange("light")}
              className="key-theme-option"
            >
              <span className="key-theme-option__swatch key-theme-option__swatch--light" aria-hidden />
              <span className="flex items-center gap-1.5 key-theme-option__label">
                <Sun className="h-4 w-4" />
                Light Mode
              </span>
              <span className="key-theme-option__hint">Bright white glass + soft color accents</span>
            </button>
          </div>
        </div>

        <div className="key-section-card p-4 sm:p-6 space-y-6">
          <h3 className="font-display font-bold text-gray-950 text-base flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" />
            Profile Details
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="h-16 w-16 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-sans font-bold text-xl flex items-center justify-center shadow-inner shrink-0 overflow-hidden">
              {hasProfilePhoto ? (
                <img src={avatarUrl} alt={`${name} profile`} className="h-full w-full object-cover" />
              ) : (
                profileInitials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 truncate">{name || "Your name"}</p>
              <p className="text-xs text-slate-500 mt-0.5">This photo is shown in the navbar.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Change photo
              </button>
              {hasProfilePhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl("");
                    setAvatarError("");
                  }}
                  className="rounded-xl px-2 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  aria-label="Remove profile photo"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {avatarError && (
            <p className="text-xs font-medium text-rose-600" role="alert">
              {avatarError}
            </p>
          )}

          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Choose 3D avatar
              </p>
              <p className="mt-1 text-xs text-slate-500">Round memoji-style picks. Select one, then save your profile.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {KEYS_AVATAR_PRESETS.map((avatar, index) => {
                const selected = avatarUrl === avatar;
                return (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(avatar);
                      setAvatarError("");
                    }}
                    className={`h-12 w-12 overflow-hidden rounded-full border-2 bg-slate-100 transition-all shadow-sm ${
                      selected
                        ? "border-indigo-600 ring-2 ring-indigo-100 scale-105"
                        : "border-white/80 hover:border-indigo-200 hover:scale-105"
                    }`}
                    aria-label={`Choose 3D avatar ${index + 1}`}
                    aria-pressed={selected}
                  >
                    <img src={avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                );
              })}
            </div>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              <span>Profile saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-6" noValidate>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-sm text-gray-950 focus:outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-sm text-gray-950 focus:outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all"
              />
            </div>

            {profileError && (
              <p className="text-xs font-medium text-rose-600" role="alert">
                {profileError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={isUpdating || !isDirty}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-100/50 flex items-center gap-2 transition-all disabled:opacity-60 active:scale-95"
              >
                {isUpdating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                <span>{isUpdating ? "Saving…" : "Save Profile Changes"}</span>
              </button>
              {isDirty && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleResetProfile}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-60"
                >
                  Discard
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="key-section-card p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display font-bold text-gray-950 text-base flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-400" />
              Data Portability & Porting
            </h3>
            <span className="bg-indigo-50 text-indigo-600 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
              Full Database
            </span>
          </div>

          <p className="text-gray-500 text-xs leading-relaxed">
            Instantly port your entire workspace, including published pages, widgets, templates, pixels,
            shortened links, and contacts.
          </p>

          {importStatus === "success" && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Workspace Restored Successfully!</span>
              </div>
              <p className="text-emerald-600/90 pl-5.5">
                Pages, links, templates, and related workspace data have been imported.
              </p>
            </div>
          )}

          {importStatus === "error" && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>Import Restoration Failed</span>
              </div>
              <p className="text-red-600/90 pl-5.5">{errorMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <FileJson className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800">Export All User Data</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Downloads a local `.json` backup of pages, contacts, templates, tracking IDs, and settings.
                </p>
              </div>
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExport}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
              >
                {isExporting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>{isExporting ? "Preparing…" : "Download Backup JSON"}</span>
              </button>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col justify-between space-y-6 ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/30"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="space-y-1.5 text-center md:text-left">
                <div className="flex items-center gap-1.5 justify-center md:justify-start">
                  <Upload className={`h-4 w-4 ${isDragging ? "text-indigo-600 animate-bounce" : "text-slate-400"}`} />
                  <span className="text-xs font-bold text-slate-800">Import & Restore Data</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Drag and drop your backup `.json` here, or choose a file from your device.
                </p>
              </div>

              <div className="w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importStatus === "loading"}
                  className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {importStatus === "loading" ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Database className="h-3.5 w-3.5 text-indigo-500" />
                  )}
                  <span>
                    {importStatus === "loading" ? "Restoring Workspace..." : "Choose Backup File"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-2 text-[10px] text-amber-700 leading-relaxed">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Warning:</strong> Restoring a backup overwrites your current local workspace. Export a
              backup first if you may need to roll back.
            </span>
          </div>
        </div>

        <div className="key-section-card p-4 sm:p-6 space-y-6">
          <h3 className="font-display font-bold text-gray-950 text-base flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-400" />
            Security & Credentials
          </h3>
          <p className="text-gray-500 text-xs leading-relaxed">
            Update your password and manage two-factor authentication for this workspace account.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                setPasswordError("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setShowPasswordModal(true);
              }}
              className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs py-2.5 px-4 rounded-xl"
            >
              Change password
            </button>
            <button
              type="button"
              onClick={() => {
                setMfaError("");
                setMfaCode("");
                setShowMfaModal(true);
              }}
              className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs py-2.5 px-4 rounded-xl inline-flex items-center justify-center gap-1.5"
            >
              <Shield className="h-3.5 w-3.5" />
              {user.mfaEnabled ? "Manage MFA" : "Configure MFA"}
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(ScreenId.CONTACT_SUPPORT)}
                className="text-xs font-semibold text-indigo-600 hover:underline px-2 py-2.5"
              >
                Need help? Contact support
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            MFA status:{" "}
            <span className="font-semibold text-slate-600">
              {user.mfaEnabled ? "Enabled" : "Disabled"}
            </span>
          </p>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-modal-title"
            className="key-modal-panel max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="password-modal-title" className="font-display font-black text-lg text-slate-900">
                Change password
              </h3>
              <button
                type="button"
                onClick={() => !isSavingPassword && setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-6" noValidate>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Current password
                </label>
                <input
                  type="password"
                  autoFocus
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              {passwordError && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {passwordError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSavingPassword}
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-70 text-white rounded-xl text-xs font-extrabold"
                >
                  {isSavingPassword ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMfaModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mfa-modal-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="mfa-modal-title" className="font-display font-black text-lg text-slate-900">
                {user.mfaEnabled ? "Manage MFA" : "Enable MFA"}
              </h3>
              <button
                type="button"
                onClick={() => !isSavingMfa && setShowMfaModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {user.mfaEnabled ? (
              <div className="space-y-6">
                <p className="text-sm text-slate-600">
                  Two-factor authentication is currently enabled on this account.
                </p>
                <button
                  type="button"
                  disabled={isSavingMfa}
                  onClick={disableMfa}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 py-2.5 rounded-xl text-xs font-extrabold disabled:opacity-70"
                >
                  {isSavingMfa ? "Disabling…" : "Disable MFA"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleMfaSubmit} className="space-y-6" noValidate>
                <p className="text-sm text-slate-600">
                  Add this account to your authenticator app, then enter a 6-digit verification code.
                </p>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Setup key
                  </p>
                  <p className="font-mono text-sm text-slate-800 break-all">KEYLINK360-MFA-SETUP-KEY</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                    Backup codes
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-700">
                    {backupCodes.map((code) => (
                      <span key={code}>{code}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyBackupCodes()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 pt-1"
                  >
                    {copiedBackup ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy backup codes
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={mfaCode}
                    onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                {mfaError && (
                  <p className="text-xs font-medium text-rose-600" role="alert">
                    {mfaError}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={isSavingMfa}
                    onClick={() => setShowMfaModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMfa}
                    className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-70 text-white rounded-xl text-xs font-extrabold"
                  >
                    {isSavingMfa ? "Enabling…" : "Enable MFA"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {pendingImport !== null && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-confirm-title"
            className="key-modal-panel max-w-sm w-full"
          >
            <h3 id="import-confirm-title" className="font-display font-black text-lg text-slate-900 mb-2">
              Restore this backup?
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              This will overwrite your current workspace data. Export a backup first if you may need to
              undo this.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingImport(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => applyImport(pendingImport)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold"
              >
                Restore backup
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            className="key-modal-panel max-w-sm w-full"
          >
            <h3 id="logout-confirm-title" className="font-display font-black text-lg text-slate-900 mb-2">
              Log out?
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              You will need to sign in again to access this workspace.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto bg-slate-900 text-white border border-slate-800 text-xs font-black py-3 px-5 rounded-2xl shadow-2xl z-50 max-w-sm sm:ml-auto">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
