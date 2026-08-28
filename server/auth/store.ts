import { getRootStore, setRootStore } from "../db/rootStore";
import { getSupabase, isSupabaseConfigured } from "../db/supabase";
import {
  AuthStoreShape,
  AuthUserRecord,
  UserStatus,
  hashPassword,
  publicUser,
  randomToken,
  verifyPassword
} from "./crypto";
import { buildDefaultAvatarUrl } from "./avatars";

function readRootStore(): Record<string, unknown> {
  return getRootStore();
}

function writeRootStore(data: Record<string, unknown>) {
  setRootStore(data);
}

function emptyAuthStore(): AuthStoreShape {
  // NOTE: Registered users live in root.auth.users (persisted via rootStore).
  // Admin page to list/manage these records can be added later — do not block signup on that.
  return {
    users: [],
    sessions: [],
    passwordResetTokens: [],
    emailVerificationTokens: [],
    oauthAccounts: [],
    loginHistory: [],
    auditLogs: [],
    rateLimits: {}
  };
}

const DEMO_EMAIL = "keylink360@gmail.com";
const DEMO_PASSWORD = "keyslink3601234";

type AuthUserRow = {
  id?: unknown;
  email?: unknown;
  password_hash?: unknown;
  password_salt?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  company_name?: unknown;
  business_name?: unknown;
  phone?: unknown;
  country?: unknown;
  avatar_url?: unknown;
  plan?: unknown;
  is_verified?: unknown;
  email_verified?: unknown;
  status?: unknown;
  mfa_enabled?: unknown;
  newsletter_opt_in?: unknown;
  preferred_dns_provider?: unknown;
  failed_login_attempts?: unknown;
  locked_until?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  last_login_at?: unknown;
};

function asStatus(value: unknown): UserStatus {
  const status = String(value || "active");
  if (status === "inactive" || status === "blocked" || status === "deleted") return status;
  return "active";
}

function mapAuthUserRow(row: AuthUserRow): AuthUserRecord | null {
  const id = String(row.id || "").trim();
  const email = String(row.email || "").trim().toLowerCase();
  if (!id || !email) return null;
  const now = new Date().toISOString();
  return {
    id,
    email,
    passwordHash: typeof row.password_hash === "string" ? row.password_hash : null,
    passwordSalt: typeof row.password_salt === "string" ? row.password_salt : null,
    firstName: String(row.first_name || ""),
    lastName: String(row.last_name || ""),
    companyName: String(row.company_name || ""),
    businessName: String(row.business_name || ""),
    phone: String(row.phone || ""),
    country: String(row.country || ""),
    avatarUrl: String(row.avatar_url || ""),
    plan: String(row.plan || "Free Plan"),
    isVerified: Boolean(row.is_verified),
    emailVerified: Boolean(row.email_verified),
    status: asStatus(row.status),
    mfaEnabled: Boolean(row.mfa_enabled),
    newsletterOptIn: Boolean(row.newsletter_opt_in),
    preferredDnsProvider:
      typeof row.preferred_dns_provider === "string" ? row.preferred_dns_provider : null,
    failedLoginAttempts:
      typeof row.failed_login_attempts === "number" ? row.failed_login_attempts : 0,
    lockedUntil: typeof row.locked_until === "string" ? row.locked_until : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : now,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : now,
    lastLoginAt: typeof row.last_login_at === "string" ? row.last_login_at : null
  };
}

function mergeAuthUsers(existing: AuthUserRecord[], incoming: AuthUserRecord[]): AuthUserRecord[] {
  const byId = new Map<string, AuthUserRecord>();
  const byEmail = new Map<string, string>();
  for (const user of existing) {
    byId.set(user.id, user);
    byEmail.set(user.email.trim().toLowerCase(), user.id);
  }
  for (const user of incoming) {
    const email = user.email.trim().toLowerCase();
    const existingId = byEmail.get(email);
    if (existingId && existingId !== user.id) {
      // Keep the in-memory id if email already present; refresh credentials/profile.
      const current = byId.get(existingId);
      if (!current) continue;
      byId.set(existingId, {
        ...current,
        ...user,
        id: existingId,
        email,
        passwordHash: user.passwordHash || current.passwordHash,
        passwordSalt: user.passwordSalt || current.passwordSalt
      });
      continue;
    }
    byId.set(user.id, { ...user, email });
    byEmail.set(email, user.id);
  }
  return Array.from(byId.values());
}

/** Pull users from normalized auth_users when root.auth.users was wiped/empty on a host. */
export async function hydrateAuthUsersFromSupabase(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  try {
    const { getDataStoreStatus } = await import("../db/rootStore");
    if (getDataStoreStatus().supabaseCooldownUntil) return 0;
  } catch {
    /* ignore */
  }
  const supabase = getSupabase();
  if (!supabase) return 0;

  try {
    const { data, error } = await supabase.from("auth_users").select("*").limit(5000);
    if (error || !Array.isArray(data) || data.length === 0) {
      if (error) console.error("hydrateAuthUsersFromSupabase failed:", error.message);
      return 0;
    }

    const mapped = data
      .map((row) => mapAuthUserRow(row as AuthUserRow))
      .filter((row): row is AuthUserRecord => Boolean(row));
    if (!mapped.length) return 0;

    const root = readRootStore();
    const raw = (root.auth as AuthStoreShape | undefined) || emptyAuthStore();
    const before = Array.isArray(raw.users) ? raw.users.length : 0;
    const store: AuthStoreShape = {
      ...emptyAuthStore(),
      ...raw,
      users: mergeAuthUsers(Array.isArray(raw.users) ? raw.users : [], mapped),
      sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
      passwordResetTokens: Array.isArray(raw.passwordResetTokens) ? raw.passwordResetTokens : [],
      emailVerificationTokens: Array.isArray(raw.emailVerificationTokens)
        ? raw.emailVerificationTokens
        : [],
      oauthAccounts: Array.isArray(raw.oauthAccounts) ? raw.oauthAccounts : [],
      loginHistory: Array.isArray(raw.loginHistory) ? raw.loginHistory : [],
      auditLogs: Array.isArray(raw.auditLogs) ? raw.auditLogs : [],
      rateLimits: raw.rateLimits && typeof raw.rateLimits === "object" ? raw.rateLimits : {}
    };

    // Repair demo password after hydrate so known credentials always work in prod.
    if (shouldSeedDemoUser()) {
      seedDemoUser(store);
    }

    writeAuthStore(store);
    console.log(
      `Auth: hydrated ${store.users.length} user(s) from Supabase auth_users (was ${before})`
    );
    return store.users.length;
  } catch (error) {
    console.error("hydrateAuthUsersFromSupabase failed:", error);
    return 0;
  }
}

/** Login miss fallback — fetch one user by email from auth_users. */
export async function fetchAuthUserByEmailFromSupabase(
  email: string
): Promise<AuthUserRecord | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { getDataStoreStatus } = await import("../db/rootStore");
    if (getDataStoreStatus().supabaseCooldownUntil) return null;
  } catch {
    /* ignore */
  }
  const supabase = getSupabase();
  if (!supabase) return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  try {
    const { data, error } = await supabase
      .from("auth_users")
      .select("*")
      .ilike("email", normalized)
      .maybeSingle();
    if (error || !data) {
      if (error) console.error("fetchAuthUserByEmailFromSupabase failed:", error.message);
      return null;
    }
    const user = mapAuthUserRow(data as AuthUserRow);
    if (!user) return null;

    const store = readAuthStore();
    store.users = mergeAuthUsers(store.users, [user]);
    if (shouldSeedDemoUser() && normalized === DEMO_EMAIL) {
      seedDemoUser(store);
    }
    writeAuthStore(store);
    return findUserByEmail(store, normalized);
  } catch (error) {
    console.error("fetchAuthUserByEmailFromSupabase failed:", error);
    return null;
  }
}

/** Returns true when the auth store was mutated (create or password repair). */
function seedDemoUser(store: AuthStoreShape): boolean {
  const email = DEMO_EMAIL;
  const existing = store.users.find((user) => (user.email || "").trim().toLowerCase() === email);
  const now = new Date().toISOString();

  if (existing) {
    const passwordOk =
      Boolean(existing.passwordHash) &&
      Boolean(existing.passwordSalt) &&
      verifyPassword(DEMO_PASSWORD, existing.passwordSalt, existing.passwordHash);

    let mutated = false;
    if (!passwordOk) {
      const { salt, hash } = hashPassword(DEMO_PASSWORD);
      existing.passwordHash = hash;
      existing.passwordSalt = salt;
      mutated = true;
    }

    if (existing.status !== "active") {
      existing.status = "active";
      mutated = true;
    }
    if (!existing.emailVerified || !existing.isVerified) {
      existing.emailVerified = true;
      existing.isVerified = true;
      mutated = true;
    }
    if (existing.lockedUntil || existing.failedLoginAttempts > 0) {
      existing.lockedUntil = null;
      existing.failedLoginAttempts = 0;
      mutated = true;
    }
    if (existing.role !== "MAIN_OWNER") {
      existing.role = "MAIN_OWNER";
      mutated = true;
    }
    if (mutated) existing.updatedAt = now;
    return mutated;
  }

  const { salt, hash } = hashPassword(DEMO_PASSWORD);
  const demo: AuthUserRecord = {
    id: "user_demo_keylink360",
    email,
    role: "MAIN_OWNER",
    passwordHash: hash,
    passwordSalt: salt,
    firstName: "KEYLINK",
    lastName: "360",
    companyName: "KEYLINK360",
    businessName: "KEYLINK360",
    phone: "",
    country: "United States",
    avatarUrl: buildDefaultAvatarUrl("key"),
    plan: "Free Plan",
    isVerified: true,
    emailVerified: true,
    status: "active",
    mfaEnabled: false,
    newsletterOptIn: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null
  };

  store.users.unshift(demo);
  return true;
}

/**
 * Seed/repair demo login unless explicitly disabled.
 * Production previously skipped this, so Railway hosts with empty root.auth.users
 * rejected keylink360@gmail.com even though auth_users still had the account.
 */
function shouldSeedDemoUser(): boolean {
  if (process.env.AUTH_SEED_DEMO === "false") return false;
  if (process.env.AUTH_SEED_DEMO === "true") return true;
  // Default on — product relies on this known admin/demo account across deploys.
  return true;
}

export function readAuthStore(): AuthStoreShape {
  const root = readRootStore();
  const raw = (root.auth as AuthStoreShape | undefined) || emptyAuthStore();
  const store: AuthStoreShape = {
    ...emptyAuthStore(),
    ...raw,
    users: Array.isArray(raw.users) ? raw.users : [],
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    passwordResetTokens: Array.isArray(raw.passwordResetTokens) ? raw.passwordResetTokens : [],
    emailVerificationTokens: Array.isArray(raw.emailVerificationTokens)
      ? raw.emailVerificationTokens
      : [],
    oauthAccounts: Array.isArray(raw.oauthAccounts) ? raw.oauthAccounts : [],
    loginHistory: Array.isArray(raw.loginHistory) ? raw.loginHistory : [],
    auditLogs: Array.isArray(raw.auditLogs) ? raw.auditLogs : [],
    rateLimits: raw.rateLimits && typeof raw.rateLimits === "object" ? raw.rateLimits : {}
  };

  if (shouldSeedDemoUser()) {
    const mutated = seedDemoUser(store);
    if (mutated) {
      root.auth = store;
      writeRootStore(root);
    }
  }
  return store;
}

export function writeAuthStore(store: AuthStoreShape) {
  const root = readRootStore();
  root.auth = store;
  writeRootStore(root);
}

export function findUserByEmail(store: AuthStoreShape, email: string) {
  const normalized = email.trim().toLowerCase();
  return (
    store.users.find((user) => (user.email || "").trim().toLowerCase() === normalized) || null
  );
}

export function findUserById(store: AuthStoreShape, id: string) {
  return store.users.find((user) => user.id === id) || null;
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${randomToken(4)}`;
}

export function audit(
  store: AuthStoreShape,
  action: string,
  userId: string | null,
  meta: Record<string, unknown> = {}
) {
  store.auditLogs.unshift({
    id: createId("audit"),
    userId,
    action,
    meta,
    createdAt: new Date().toISOString()
  });
  store.auditLogs = store.auditLogs.slice(0, 500);
}

export function recordLogin(
  store: AuthStoreShape,
  input: {
    userId: string | null;
    email: string;
    success: boolean;
    reason: string;
    ip: string;
    userAgent: string;
  }
) {
  store.loginHistory.unshift({
    id: createId("login"),
    ...input,
    createdAt: new Date().toISOString()
  });
  store.loginHistory = store.loginHistory.slice(0, 500);
}

export function checkRateLimit(
  store: AuthStoreShape,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const current = store.rateLimits[key];
  if (!current || now - current.windowStart > windowMs) {
    store.rateLimits[key] = { count: 1, windowStart: now };
    return { allowed: true, retryAfterSec: 0 };
  }
  if (current.count >= limit) {
    const retryAfterSec = Math.ceil((windowMs - (now - current.windowStart)) / 1000);
    return { allowed: false, retryAfterSec };
  }
  current.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export { publicUser, DEMO_EMAIL, DEMO_PASSWORD };
