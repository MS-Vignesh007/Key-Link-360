import bcrypt from "bcryptjs";
import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual, createHash } from "crypto";

export const BCRYPT_SALT_ROUNDS = 12;

const DEV_FALLBACK_SECRET = "KEYLINK360-dev-secret-change-me-in-production";

function resolveAuthSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === DEV_FALLBACK_SECRET || secret.length < 32) {
      throw new Error(
        "AUTH_SECRET must be set to a strong random value (32+ chars) in production."
      );
    }
    return secret;
  }
  if (!secret) {
    console.warn("[auth] AUTH_SECRET not set — using development fallback. Do not use in production.");
    return DEV_FALLBACK_SECRET;
  }
  return secret;
}

const AUTH_SECRET = resolveAuthSecret();

export function getAuthSecret() {
  return AUTH_SECRET;
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 * Never uses standard '===' or '!==' for security credentials.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(String(a), "utf8");
    const bufB = Buffer.from(String(b), "utf8");
    if (bufA.length !== bufB.length) {
      // Execute dummy comparison of identical buffers to maintain constant timing
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Validates whether a hash string is a secure bcrypt hash with at least the required rounds.
 */
export function isBcryptHash(hash: string | null | undefined, minRounds = BCRYPT_SALT_ROUNDS): boolean {
  if (!hash || typeof hash !== "string") return false;
  const match = hash.match(/^\$2[aby]\$(\d{2})\$/);
  if (!match) return false;
  const rounds = parseInt(match[1], 10);
  return !isNaN(rounds) && rounds >= minRounds;
}

/**
 * Hashes a plaintext password using bcrypt with a salt round of at least 12.
 */
export function hashPassword(password: string, rounds = BCRYPT_SALT_ROUNDS): { salt: string; hash: string } {
  if (!password || typeof password !== "string") {
    throw new Error("Cannot hash an empty or invalid password.");
  }
  const effectiveRounds = Math.max(12, rounds);
  const salt = bcrypt.genSaltSync(effectiveRounds);
  const hash = bcrypt.hashSync(password, salt);
  return { salt, hash };
}

export type PasswordAlgorithm =
  | "bcrypt"
  | "bcrypt_low_cost"
  | "legacy_scrypt"
  | "legacy_sha256"
  | "legacy_sha1"
  | "legacy_md5"
  | "legacy_plaintext";

export interface PasswordVerificationResult {
  valid: boolean;
  needsRehash: boolean;
  matchedAlgorithm?: PasswordAlgorithm;
  upgraded?: { salt: string; hash: string };
}

/**
 * Verifies a candidate password against stored hashes with constant-time comparison.
 * Seamlessly detects legacy hashes (scrypt, sha256, sha1, md5, plaintext, low-round bcrypt)
 * and produces an upgraded bcrypt(12) hash for on-login migration.
 */
export function verifyAndUpgradePassword(
  password: string,
  salt?: string | null,
  hash?: string | null
): PasswordVerificationResult {
  if (!password || !hash || typeof password !== "string" || typeof hash !== "string") {
    return { valid: false, needsRehash: false };
  }

  // 1. Standard Bcrypt check ($2a$, $2b$, $2y$)
  if (/^\$2[aby]\$\d{2}\$/.test(hash)) {
    try {
      const valid = bcrypt.compareSync(password, hash);
      if (!valid) {
        return { valid: false, needsRehash: false };
      }
      const match = hash.match(/^\$2[aby]\$(\d{2})\$/);
      const rounds = match ? parseInt(match[1], 10) : 0;
      const isLowCost = rounds < BCRYPT_SALT_ROUNDS;
      return {
        valid: true,
        needsRehash: isLowCost,
        matchedAlgorithm: isLowCost ? "bcrypt_low_cost" : "bcrypt",
        upgraded: isLowCost ? hashPassword(password, BCRYPT_SALT_ROUNDS) : undefined
      };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // 2. Legacy Scrypt check (128-character hex hash with salt)
  if (salt && hash.length === 128 && /^[0-9a-fA-F]+$/.test(hash)) {
    try {
      const hashed = scryptSync(password, salt, 64);
      const expected = Buffer.from(hash, "hex");
      if (hashed.length === expected.length && timingSafeEqual(hashed, expected)) {
        return {
          valid: true,
          needsRehash: true,
          matchedAlgorithm: "legacy_scrypt",
          upgraded: hashPassword(password, BCRYPT_SALT_ROUNDS)
        };
      }
    } catch {
      // fall through
    }
  }

  // 3. Legacy SHA-256 / SHA-1 / MD5 check (with/without salt)
  const algorithms = [
    { name: "sha256" as const, len: 64, type: "legacy_sha256" as const },
    { name: "sha1" as const, len: 40, type: "legacy_sha1" as const },
    { name: "md5" as const, len: 32, type: "legacy_md5" as const }
  ];

  for (const { name, len, type } of algorithms) {
    if (hash.length === len && /^[0-9a-fA-F]+$/.test(hash)) {
      try {
        // Without salt
        const digestNoSalt = createHash(name).update(password).digest("hex");
        if (constantTimeCompare(digestNoSalt.toLowerCase(), hash.toLowerCase())) {
          return {
            valid: true,
            needsRehash: true,
            matchedAlgorithm: type,
            upgraded: hashPassword(password, BCRYPT_SALT_ROUNDS)
          };
        }
        // With salt
        if (salt) {
          const digestWithSalt1 = createHash(name).update(password + salt).digest("hex");
          if (constantTimeCompare(digestWithSalt1.toLowerCase(), hash.toLowerCase())) {
            return {
              valid: true,
              needsRehash: true,
              matchedAlgorithm: type,
              upgraded: hashPassword(password, BCRYPT_SALT_ROUNDS)
            };
          }
          const digestWithSalt2 = createHash(name).update(salt + password).digest("hex");
          if (constantTimeCompare(digestWithSalt2.toLowerCase(), hash.toLowerCase())) {
            return {
              valid: true,
              needsRehash: true,
              matchedAlgorithm: type,
              upgraded: hashPassword(password, BCRYPT_SALT_ROUNDS)
            };
          }
        }
      } catch {
        // fall through
      }
    }
  }

  // 4. Legacy plaintext check (using constant-time comparison)
  if (constantTimeCompare(password, hash)) {
    return {
      valid: true,
      needsRehash: true,
      matchedAlgorithm: "legacy_plaintext",
      upgraded: hashPassword(password, BCRYPT_SALT_ROUNDS)
    };
  }

  return { valid: false, needsRehash: false };
}

/**
 * Standard password verification helper.
 */
export function verifyPassword(password: string, salt?: string | null, hash?: string | null): boolean {
  return verifyAndUpgradePassword(password, salt, hash).valid;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function randomOtp(): string {
  return String(randomInt(100000, 1000000));
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64").toString("utf8");
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  sid: string;
  typ: "access";
  iat: number;
  exp: number;
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "iat" | "exp" | "typ">, expiresInSec = 60 * 15) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(
    JSON.stringify({
      ...payload,
      typ: "access",
      iat: now,
      exp: now + expiresInSec
    } satisfies AccessTokenPayload)
  );
  const sig = createHmac("sha256", AUTH_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = createHmac("sha256", AUTH_SECRET).update(`${header}.${body}`).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(fromBase64url(body)) as AccessTokenPayload;
    if (payload.typ !== "access") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export type UserRole = "MAIN_OWNER" | "SUB_OWNER";

export function isMainOwnerUser(user?: { role?: string; email?: string } | null): boolean {
  if (!user) return false;
  if (user.role === "MAIN_OWNER") return true;
  const ownerEmail = (process.env.MAIN_OWNER_EMAIL || "keylink360@gmail.com").trim().toLowerCase();
  return Boolean(user.email && user.email.trim().toLowerCase() === ownerEmail);
}

export function publicUser(user: AuthUserRecord) {
  const role: UserRole =
    user.role === "MAIN_OWNER" || isMainOwnerUser(user) ? "MAIN_OWNER" : "SUB_OWNER";
  return {
    id: user.id,
    email: user.email,
    role,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    companyName: user.companyName,
    businessName: user.businessName,
    phone: user.phone,
    country: user.country,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
    isVerified: user.isVerified,
    emailVerified: user.emailVerified,
    status: user.status,
    mfaEnabled: user.mfaEnabled,
    newsletterOptIn: user.newsletterOptIn,
    preferredDnsProvider: user.preferredDnsProvider || null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
}

export type UserStatus = "active" | "inactive" | "blocked" | "deleted";

export interface AuthUserRecord {
  id: string;
  email: string;
  role?: UserRole;
  passwordHash: string | null;
  passwordSalt: string | null;
  firstName: string;
  lastName: string;
  companyName: string;
  businessName: string;
  phone: string;
  country: string;
  avatarUrl: string;
  plan: string;
  isVerified: boolean;
  emailVerified: boolean;
  status: UserStatus;
  mfaEnabled: boolean;
  newsletterOptIn: boolean;
  /** Remembered DNS host for custom-domain onboarding (cloudflare, godaddy, other, …). */
  preferredDnsProvider?: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AuthSessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  rememberMe: boolean;
  userAgent: string;
  ip: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  email: string;
  otpHash: string;
  tokenHash: string;
  attempts: number;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface EmailVerificationRecord {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface OAuthAccountRecord {
  id: string;
  userId: string;
  provider: "google" | "github";
  providerUserId: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
}

export interface LoginHistoryRecord {
  id: string;
  userId: string | null;
  email: string;
  success: boolean;
  reason: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  userId: string | null;
  action: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface AuthStoreShape {
  users: AuthUserRecord[];
  sessions: AuthSessionRecord[];
  passwordResetTokens: PasswordResetRecord[];
  emailVerificationTokens: EmailVerificationRecord[];
  oauthAccounts: OAuthAccountRecord[];
  loginHistory: LoginHistoryRecord[];
  auditLogs: AuditLogRecord[];
  rateLimits: Record<string, { count: number; windowStart: number }>;
}
