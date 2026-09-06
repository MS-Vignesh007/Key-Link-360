import { apiUrl } from "./apiBase";
import { defaultAvatarUrlForEmail } from "./avatarPresets";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  companyName: string;
  businessName: string;
  phone: string;
  country: string;
  avatarUrl: string;
  plan: string;
  isVerified: boolean;
  emailVerified: boolean;
  status: string;
  mfaEnabled?: boolean;
  newsletterOptIn?: boolean;
  preferredDnsProvider?: string | null;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthConfig {
  googleEnabled: boolean;
  githubEnabled: boolean;
  googleClientId: string;
  githubClientId: string;
  appUrl: string;
  exposeTokens: boolean;
  /** When false, new accounts can sign in immediately without email verification. */
  emailVerificationRequired?: boolean;
  allowDevOAuth: boolean;
  demoHint: { email: string; password: string } | null;
  idleTimeoutMs: number;
}

const ACCESS_KEY = "keylink360_access_token";
const REFRESH_KEY = "keylink360_refresh_token";
const USER_KEY = "keylink360_auth_user";
const ACTIVITY_KEY = "keylink360_last_activity";

/** Client-only preview sessions (no backend). Prefix keeps real JWT path reusable later. */
export const PREVIEW_TOKEN_PREFIX = "preview_";

export function isPreviewToken(token: string | null | undefined): boolean {
  return Boolean(token && token.startsWith(PREVIEW_TOKEN_PREFIX));
}

/**
 * Preview mode for static hosts (e.g. Vercel) without an API.
 * - Set VITE_AUTH_PREVIEW=true to force on
 * - Set VITE_AUTH_PREVIEW=false to force off
 * - Default: on when auth backend is unreachable
 */
export function isAuthPreviewForced(): boolean {
  return import.meta.env.VITE_AUTH_PREVIEW === "true";
}

export function isAuthPreviewDisabled(): boolean {
  return import.meta.env.VITE_AUTH_PREVIEW === "false";
}

export async function probeAuthBackend(): Promise<boolean> {
  try {
    const response = await fetch(apiUrl("/api/auth/config"), {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });
    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data && typeof data === "object" && "appUrl" in data);
  } catch {
    return false;
  }
}

export function createPreviewAuthUser(
  input: {
    email?: string;
    name?: string;
    avatarUrl?: string;
    provider?: "google" | "github" | "password";
  } = {}
): AuthUser {
  const provider = input.provider || "password";
  const email =
    (input.email || "").trim().toLowerCase() ||
    (provider === "google"
      ? "preview.google@keylink360.local"
      : provider === "github"
        ? "preview.github@keylink360.local"
        : "preview.user@keylink360.local");
  const name =
    (input.name || "").trim() ||
    (provider === "google" ? "Google Preview" : provider === "github" ? "GitHub Preview" : "Preview User");
  const parts = name.split(/\s+/);
  const firstName = parts[0] || "Preview";
  const lastName = parts.slice(1).join(" ") || "User";
  const now = new Date().toISOString();

  return {
    id: `preview_${provider}_${email.replace(/[^a-z0-9]/gi, "_").slice(0, 24)}`,
    email,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    companyName: "KEYLINK360 Preview",
    businessName: "KEYLINK360 Preview",
    phone: "",
    country: "United States",
    avatarUrl:
      input.avatarUrl || defaultAvatarUrlForEmail(email),
    plan: "Free Plan",
    isVerified: true,
    emailVerified: true,
    status: "active",
    mfaEnabled: false,
    newsletterOptIn: false,
    createdAt: now,
    lastLoginAt: now
  };
}

export function createPreviewTokens(): AuthTokens {
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return {
    accessToken: `${PREVIEW_TOKEN_PREFIX}access_${stamp}`,
    refreshToken: `${PREVIEW_TOKEN_PREFIX}refresh_${stamp}`,
    expiresIn: 60 * 60 * 24 * 7
  };
}

export function enterPreviewSession(
  user: AuthUser,
  rememberMe: boolean
): { user: AuthUser; accessToken: string; refreshToken: string } {
  const tokens = createPreviewTokens();
  saveAuthSession(user, tokens, rememberMe);
  return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

export function saveAuthSession(user: AuthUser, tokens: AuthTokens, rememberMe: boolean) {
  const storage = rememberMe ? localStorage : sessionStorage;
  const other = rememberMe ? sessionStorage : localStorage;
  other.removeItem(ACCESS_KEY);
  other.removeItem(REFRESH_KEY);
  other.removeItem(USER_KEY);
  storage.setItem(ACCESS_KEY, tokens.accessToken);
  storage.setItem(REFRESH_KEY, tokens.refreshToken);
  storage.setItem(USER_KEY, JSON.stringify(user));
  touchActivity();
}

export function clearAuthSession(reason?: string) {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem("keylink360_session");
  sessionStorage.removeItem("keyslink_session");
  localStorage.removeItem(ACTIVITY_KEY);
  sessionStorage.removeItem(ACTIVITY_KEY);
  if (typeof window !== "undefined" && reason !== "silent") {
    window.dispatchEvent(
      new CustomEvent("keylink360:auth-expired", { detail: { reason: reason || "cleared" } })
    );
  }
}

export function touchActivity() {
  const value = String(Date.now());
  if (localStorage.getItem(ACCESS_KEY)) localStorage.setItem(ACTIVITY_KEY, value);
  if (sessionStorage.getItem(ACCESS_KEY)) sessionStorage.setItem(ACTIVITY_KEY, value);
}

export function getLastActivity(): number {
  const raw = localStorage.getItem(ACTIVITY_KEY) || sessionStorage.getItem(ACTIVITY_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
}

export function getStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export class AuthApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "UNKNOWN", status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    throw new AuthApiError(
      data?.error || "Request failed.",
      data?.code || "REQUEST_FAILED",
      response.status
    );
  }
  return data as T;
}

async function authFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const accessToken = getAccessToken();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(apiUrl(path), { ...init, headers, credentials: "include" });
  } catch {
    throw new AuthApiError("Network error. Check your connection and try again.", "NETWORK_ERROR", 0);
  }

  if (response.status === 401 && retry && getRefreshToken()) {
    try {
      await refreshSession();
      return authFetch<T>(path, init, false);
    } catch {
      clearAuthSession("session_expired");
    }
  }

  return parseResponse<T>(response);
}

export async function fetchAuthConfig() {
  return authFetch<AuthConfig>("/api/auth/config", {}, false);
}

export async function loginRequest(input: {
  email: string;
  password: string;
  rememberMe: boolean;
}) {
  return authFetch<{
    success: boolean;
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    false
  );
}

export async function registerRequest(input: Record<string, unknown>) {
  return authFetch<{
    success: boolean;
    message: string;
    user: AuthUser;
    canLogin?: boolean;
    emailVerificationRequired?: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    verificationToken?: string;
  }>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    false
  );
}

export async function forgotPasswordRequest(email: string) {
  return authFetch<{
    success: boolean;
    message: string;
    resetToken?: string;
    otp?: string;
  }>(
    "/api/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email })
    },
    false
  );
}

export async function verifyResetOtpRequest(email: string, otp: string) {
  return authFetch<{ success: boolean }>("/api/auth/verify-reset-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp })
  }, false);
}

export async function resetPasswordRequest(input: {
  email: string;
  resetToken?: string;
  token?: string;
  otp?: string;
  password: string;
  confirmPassword: string;
}) {
  return authFetch<{ success: boolean; message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input)
  }, false);
}

export async function verifyEmailRequest(token: string) {
  return authFetch<{ success: boolean; message: string; user: AuthUser }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token })
  }, false);
}

export async function resendVerificationRequest(email: string) {
  return authFetch<{ success: boolean; message: string; verificationToken?: string }>(
    "/api/auth/resend-verification",
    {
      method: "POST",
      body: JSON.stringify({ email })
    },
    false
  );
}

export async function fetchMe() {
  return authFetch<{ user: AuthUser }>("/api/auth/me");
}

export async function logoutRequest() {
  try {
    await authFetch<{ success: boolean }>("/api/auth/logout", { method: "POST" }, false);
  } finally {
    clearAuthSession("silent");
  }
}

/**
 * Single-flight refresh. Access tokens last 15 minutes; when several API calls
 * 401 at once, rotating refresh without a lock revokes the first success and
 * the rest fail with "Session expired" (common on a second PC / idle tab).
 */
let refreshInflight: Promise<{
  success: boolean;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}> | null = null;

export async function refreshSession() {
  if (refreshInflight) return refreshInflight;

  refreshInflight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new AuthApiError("Please sign in again.", "NO_REFRESH_TOKEN", 401);
    }
    const data = await authFetch<{
      success: boolean;
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    }>(
      "/api/auth/refresh-token",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken })
      },
      false
    );
    const rememberMe = Boolean(localStorage.getItem(ACCESS_KEY));
    saveAuthSession(data.user, data, rememberMe);
    return data;
  })().finally(() => {
    refreshInflight = null;
  });

  return refreshInflight;
}

/** Probe / refresh so OAuth and domain actions do not hit a stale access token. */
export async function ensureAuthSession(): Promise<boolean> {
  const accessToken = getAccessToken();
  if (!accessToken || isPreviewToken(accessToken)) return false;
  try {
    await fetchMe();
    return true;
  } catch {
    if (!getRefreshToken()) return false;
    try {
      await refreshSession();
      return true;
    } catch {
      return false;
    }
  }
}

export async function updateProfileRequest(input: Record<string, unknown>) {
  return authFetch<{ success: boolean; user: AuthUser }>("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function changePasswordRequest(input: {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}) {
  return authFetch<{ success: boolean; message: string }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function deleteAccountRequest() {
  return authFetch<{ success: boolean }>("/api/auth/account", { method: "DELETE" });
}

export async function googleLoginRequest(input?: {
  email?: string;
  name?: string;
  avatarUrl?: string;
  idToken?: string;
  accessToken?: string;
  rememberMe?: boolean;
}) {
  return authFetch<{
    success: boolean;
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }>(
    "/api/auth/google-login",
    {
      method: "POST",
      body: JSON.stringify(input || {})
    },
    false
  );
}

export async function githubLoginRequest(input?: {
  email?: string;
  name?: string;
  avatarUrl?: string;
  code?: string;
  rememberMe?: boolean;
}) {
  return authFetch<{
    success: boolean;
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }>(
    "/api/auth/github-login",
    {
      method: "POST",
      body: JSON.stringify(input || {})
    },
    false
  );
}

export async function passwordStrengthRequest(password: string) {
  const response = await fetch(
    apiUrl(`/api/auth/password-strength?password=${encodeURIComponent(password)}`),
    { credentials: "include" }
  );
  return parseResponse<{ strength: "weak" | "fair" | "good" | "strong" }>(response);
}
