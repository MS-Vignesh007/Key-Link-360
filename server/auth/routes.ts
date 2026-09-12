import { Router, Request, Response, NextFunction } from "express";
import {
  AuthStoreShape,
  AuthUserRecord,
  hashPassword,
  hashToken,
  publicUser,
  randomOtp,
  randomToken,
  signAccessToken,
  verifyAccessToken,
  verifyPassword
} from "./crypto";
import { defaultAvatarUrlForEmail } from "./avatars";
import {
  audit,
  checkRateLimit,
  createId,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  emptyAuthStore,
  fetchAuthUserByEmailFromSupabase,
  findUserByEmail,
  findUserById,
  readAuthStore,
  recordLogin,
  writeAuthStore
} from "./store";
import { flushRootStore } from "../db/rootStore";
import {
  isDisposableEmail,
  isValidEmailFormat,
  normalizeEmail,
  passwordStrength,
  validatePassword,
  validateRegistration
} from "./validation";
import {
  requireEmailVerification,
  sendPasswordResetLink,
  sendPasswordResetOtp,
  sendVerificationEmail,
  shouldExposeAuthTokens
} from "./mail";

const ACCESS_TTL_SEC = 60 * 15;
const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const REFRESH_REMEMBER_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const RESET_TTL_MS = 1000 * 60 * 15;
const VERIFY_TTL_MS = 1000 * 60 * 60 * 24;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MS = 1000 * 60 * 15;
const IDLE_TTL_MS = 1000 * 60 * 30;

export type AuthedRequest = Request & { authUser?: ReturnType<typeof publicUser>; sessionId?: string };

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

function userAgent(req: Request) {
  return String(req.headers["user-agent"] || "unknown");
}

function appOrigin() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function extraAllowedOrigins(): string[] {
  return (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedOrigin(candidate: string, req?: Request): boolean {
  try {
    const url = new URL(candidate);
    try {
      const allowed = new URL(appOrigin());
      if (url.origin === allowed.origin) return true;
      if (url.hostname.toLowerCase() === allowed.hostname.toLowerCase()) return true;
    } catch {
      /* skip invalid appOrigin */
    }

    if (req) {
      const reqHost = (req.headers["x-forwarded-host"] || req.headers["x-original-host"] || req.headers.host);
      if (typeof reqHost === "string" && reqHost.trim()) {
        const hostWithoutPort = reqHost.split(":")[0].trim().toLowerCase();
        if (url.hostname.toLowerCase() === hostWithoutPort) return true;
      }
    }

    for (const raw of extraAllowedOrigins()) {
      try {
        const extraUrl = new URL(raw);
        if (url.origin === extraUrl.origin) return true;
        if (url.hostname.toLowerCase() === extraUrl.hostname.toLowerCase()) return true;
      } catch {
        /* skip bad entry */
      }
    }

    // Local development: allow localhost / 127.0.0.1 on any port
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;

    // Production Railway deployments & up.railway.app domains
    if (url.hostname.endsWith(".railway.app") || url.hostname.endsWith(".up.railway.app")) return true;

    if (process.env.NODE_ENV === "production") return false;
    return true;
  } catch {
    return false;
  }
}

/** Reject cross-site state-changing requests when Origin/Referer is present and mismatched. */
function assertSameOrigin(req: Request, res: Response): boolean {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return true;
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  if (!origin && !referer) return true;
  if (origin && !isAllowedOrigin(origin, req)) {
    res.status(403).json({ error: "Invalid request origin.", code: "CSRF_ORIGIN" });
    return false;
  }
  if (!origin && referer && !isAllowedOrigin(referer, req)) {
    res.status(403).json({ error: "Invalid request origin.", code: "CSRF_ORIGIN" });
    return false;
  }
  return true;
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string, rememberMe: boolean) {
  // Path A (Vercel UI → Railway API): cross-site cookies need SameSite=None; Secure.
  // Bearer tokens in localStorage remain the primary auth path.
  const crossSite =
    process.env.CROSS_ORIGIN_COOKIES === "true" ||
    process.env.NODE_ENV === "production";
  const secure = process.env.NODE_ENV === "production" || crossSite;
  const sameSite = crossSite ? ("none" as const) : ("lax" as const);
  res.cookie("key_access", accessToken, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: ACCESS_TTL_SEC * 1000,
    path: "/"
  });
  res.cookie("key_refresh", refreshToken, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: rememberMe ? REFRESH_REMEMBER_TTL_MS : REFRESH_TTL_MS,
    path: "/"
  });
}

function clearAuthCookies(res: Response) {
  const crossSite =
    process.env.CROSS_ORIGIN_COOKIES === "true" ||
    process.env.NODE_ENV === "production";
  const secure = process.env.NODE_ENV === "production" || crossSite;
  const sameSite = crossSite ? ("none" as const) : ("lax" as const);
  res.clearCookie("key_access", { path: "/", sameSite, secure });
  res.clearCookie("key_refresh", { path: "/", sameSite, secure });
}

function issueSession(
  store: ReturnType<typeof readAuthStore>,
  user: AuthUserRecord,
  req: Request,
  rememberMe: boolean
) {
  const sessionId = createId("sess");
  const refreshToken = randomToken(48);
  const now = Date.now();
  store.sessions.unshift({
    id: sessionId,
    userId: user.id,
    refreshTokenHash: hashToken(refreshToken),
    rememberMe,
    userAgent: userAgent(req),
    ip: clientIp(req),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(now + (rememberMe ? REFRESH_REMEMBER_TTL_MS : REFRESH_TTL_MS)).toISOString(),
    revokedAt: null
  });
  store.sessions = store.sessions.slice(0, 200);

  const accessToken = signAccessToken(
    { sub: user.id, email: user.email, sid: sessionId },
    ACCESS_TTL_SEC
  );

  return { accessToken, refreshToken, sessionId };
}

function getBearerOrCookie(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.key_access || null;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = getBearerOrCookie(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
    return;
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: "Session expired", code: "TOKEN_EXPIRED" });
    return;
  }
  const store = readAuthStore();
  const user = findUserById(store, payload.sub);
  if (!user || user.status === "deleted") {
    res.status(401).json({ error: "Account not found", code: "USER_NOT_FOUND" });
    return;
  }
  if (user.status === "blocked") {
    res.status(403).json({ error: "Account is blocked", code: "ACCOUNT_BLOCKED" });
    return;
  }
  if (user.status === "inactive") {
    res.status(403).json({ error: "Account is inactive", code: "ACCOUNT_INACTIVE" });
    return;
  }
  const session = store.sessions.find((item) => item.id === payload.sid && !item.revokedAt);
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
    res.status(401).json({ error: "Session expired", code: "SESSION_EXPIRED" });
    return;
  }
  req.authUser = publicUser(user);
  req.sessionId = session.id;
  next();
}

export function requireMainOwner(req: AuthedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.authUser || req.authUser.role !== "MAIN_OWNER") {
      res.status(403).json({
        error: "Access denied. Main Owner privileges required.",
        code: "FORBIDDEN_NOT_MAIN_OWNER"
      });
      return;
    }
    next();
  });
}

function assertAccountLoginable(
  user: AuthUserRecord
): { ok: true } | { ok: false; status: number; error: string; code: string } {
  if (user.status === "deleted") {
    return { ok: false, status: 403, error: "This account has been deleted.", code: "ACCOUNT_DELETED" };
  }
  if (user.status === "blocked") {
    return {
      ok: false,
      status: 403,
      error: "This account is blocked. Contact support.",
      code: "ACCOUNT_BLOCKED"
    };
  }
  if (user.status === "inactive") {
    return { ok: false, status: 403, error: "This account is inactive.", code: "ACCOUNT_INACTIVE" };
  }
  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    return {
      ok: false,
      status: 423,
      error: "Too many failed attempts. Account temporarily locked. Try again in 15 minutes.",
      code: "ACCOUNT_LOCKED"
    };
  }
  if (!user.emailVerified) {
    return {
      ok: false,
      status: 403,
      error: "Please verify your email before signing in.",
      code: "EMAIL_UNVERIFIED"
    };
  }
  return { ok: true };
}

function allowDevOAuth() {
  return (
    process.env.AUTH_ALLOW_DEV_OAUTH === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.AUTH_ALLOW_DEV_OAUTH !== "false")
  );
}

export function createAuthRouter() {
  const router = Router();

  router.use((req, res, next) => {
    if (!assertSameOrigin(req, res)) return;
    next();
  });

  router.get("/config", (_req, res) => {
    const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
    const githubClientId = process.env.GITHUB_CLIENT_ID || "";
    res.json({
      googleEnabled: Boolean(googleClientId),
      githubEnabled: Boolean(githubClientId && process.env.GITHUB_CLIENT_SECRET),
      googleClientId,
      githubClientId,
      appUrl: appOrigin(),
      exposeTokens: shouldExposeAuthTokens(),
      emailVerificationRequired: requireEmailVerification(),
      allowDevOAuth: allowDevOAuth(),
      demoHint:
        process.env.NODE_ENV !== "production" && process.env.AUTH_SEED_DEMO !== "false"
          ? { email: DEMO_EMAIL, password: DEMO_PASSWORD }
          : null,
      idleTimeoutMs: IDLE_TTL_MS
    });
  });

  router.get("/password-strength", (req, res) => {
    const password = String(req.query.password || "");
    res.json({ strength: passwordStrength(password) });
  });

  router.post("/register", async (req, res) => {
    try {
      const store = readAuthStore();
      const rate = checkRateLimit(store, `register:${clientIp(req)}`, 10, 60_000);
      if (!rate.allowed) {
        writeAuthStore(store);
        res.status(429).json({
          error: "Too many registration attempts. Try again later.",
          code: "RATE_LIMITED",
          retryAfterSec: rate.retryAfterSec
        });
        return;
      }

      const body = req.body || {};
      const validationError = validateRegistration({
        firstName: String(body.firstName || ""),
        lastName: String(body.lastName || ""),
        companyName: String(body.companyName || ""),
        businessName: String(body.businessName || ""),
        phone: String(body.phone || ""),
        country: String(body.country || ""),
        email: String(body.email || ""),
        password: String(body.password || ""),
        confirmPassword: String(body.confirmPassword || ""),
        acceptTerms: Boolean(body.acceptTerms),
        acceptPrivacy: body.acceptPrivacy === undefined ? true : Boolean(body.acceptPrivacy)
      });
      if (validationError) {
        writeAuthStore(store);
        res.status(400).json({ error: validationError, code: "VALIDATION_ERROR" });
        return;
      }

      const email = normalizeEmail(String(body.email));
      if (findUserByEmail(store, email)) {
        writeAuthStore(store);
        res.status(409).json({ error: "An account with this email already exists.", code: "DUPLICATE_EMAIL" });
        return;
      }

      const { salt, hash } = hashPassword(String(body.password));
      const now = new Date().toISOString();
      const verificationRequired = requireEmailVerification();
      const user: AuthUserRecord = {
        id: createId("user"),
        email,
        passwordHash: hash,
        passwordSalt: salt,
        firstName: String(body.firstName).trim(),
        lastName: String(body.lastName).trim(),
        companyName: String(body.companyName).trim(),
        businessName: String(body.businessName).trim(),
        phone: String(body.phone).trim(),
        country: String(body.country).trim(),
        avatarUrl: defaultAvatarUrlForEmail(email),
        role: "SUB_OWNER",
        plan: "Free Plan",
        isVerified: !verificationRequired,
        emailVerified: !verificationRequired,
        status: "active",
        mfaEnabled: false,
        newsletterOptIn: Boolean(body.newsletterOptIn),
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: verificationRequired ? null : now
      };

      let verifyToken: string | undefined;
      if (verificationRequired) {
        verifyToken = randomToken(32);
        store.emailVerificationTokens.unshift({
          id: createId("verify"),
          userId: user.id,
          email: user.email,
          tokenHash: hashToken(verifyToken),
          createdAt: now,
          expiresAt: new Date(Date.now() + VERIFY_TTL_MS).toISOString(),
          usedAt: null
        });
      }

      store.users.unshift(user);
      audit(store, "user.register", user.id, {
        email,
        emailVerified: user.emailVerified,
        verificationRequired
      });

      // Ready-to-use accounts: issue session so the client can sign in immediately.
      let tokens: { accessToken: string; refreshToken: string } | null = null;
      if (!verificationRequired) {
        tokens = issueSession(store, user, req, false);
      }

      writeAuthStore(store);

      if (verificationRequired && verifyToken) {
        await sendVerificationEmail(email, verifyToken);
      }

      if (tokens) {
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken, false);
      }

      res.status(201).json({
        success: true,
        message: verificationRequired
          ? "Account created. Please verify your email."
          : "Account created. You can sign in now.",
        user: publicUser(user),
        canLogin: !verificationRequired,
        emailVerificationRequired: verificationRequired,
        accessToken: tokens?.accessToken,
        refreshToken: tokens?.refreshToken,
        expiresIn: tokens ? ACCESS_TTL_SEC : undefined,
        verificationToken:
          verificationRequired && shouldExposeAuthTokens() ? verifyToken : undefined
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Server error during registration.", code: "SERVER_ERROR" });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const store = readAuthStore();
      const email = normalizeEmail(String(req.body?.email || ""));
      const password = String(req.body?.password || "");
      const rememberMe = Boolean(req.body?.rememberMe);
      const ip = clientIp(req);
      const ua = userAgent(req);

      const rate = checkRateLimit(store, `login:${ip}:${email}`, 20, 60_000);
      if (!rate.allowed) {
        writeAuthStore(store);
        res.status(429).json({
          error: "Too many login attempts. Please wait and try again.",
          code: "RATE_LIMITED",
          retryAfterSec: rate.retryAfterSec
        });
        return;
      }

      if (!email || !isValidEmailFormat(email)) {
        writeAuthStore(store);
        res.status(400).json({ error: "Enter a valid email address.", code: "INVALID_EMAIL" });
        return;
      }
      if (isDisposableEmail(email)) {
        writeAuthStore(store);
        res.status(400).json({
          error: "Disposable email addresses are not allowed.",
          code: "DISPOSABLE_EMAIL"
        });
        return;
      }
      if (!password) {
        writeAuthStore(store);
        res.status(400).json({ error: "Password is required.", code: "PASSWORD_REQUIRED" });
        return;
      }

      let user = findUserByEmail(store, email);
      if (!user || !user.passwordHash || !user.passwordSalt) {
        // Production hosts often have empty root.auth.users after redeploy —
        // recover the account from Supabase auth_users, then continue.
        const recovered = await fetchAuthUserByEmailFromSupabase(email);
        if (recovered) {
          user = recovered;
          // Refresh store reference after recovery write.
          Object.assign(store, readAuthStore());
          user = findUserByEmail(store, email) || recovered;
        }
      }

      if (!user || !user.passwordHash || !user.passwordSalt) {
        recordLogin(store, { userId: null, email, success: false, reason: "not_found", ip, userAgent: ua });
        writeAuthStore(store);
        res.status(401).json({ error: "Invalid email or password.", code: "INVALID_CREDENTIALS" });
        return;
      }

      // Unblock accounts created before auto-verify when SMTP/verification is not required.
      if (!user.emailVerified && !requireEmailVerification()) {
        user.emailVerified = true;
        user.isVerified = true;
        user.updatedAt = new Date().toISOString();
      }

      const loginable = assertAccountLoginable(user);
      if (loginable.ok === false) {
        recordLogin(store, {
          userId: user.id,
          email,
          success: false,
          reason: loginable.code,
          ip,
          userAgent: ua
        });
        writeAuthStore(store);
        res.status(loginable.status).json({ error: loginable.error, code: loginable.code });
        return;
      }

      const valid = verifyPassword(password, user.passwordSalt, user.passwordHash);
      if (!valid) {
        user.failedLoginAttempts += 1;
        let locked = false;
        if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.lockedUntil = new Date(Date.now() + LOCK_MS).toISOString();
          user.failedLoginAttempts = 0;
          locked = true;
        }
        user.updatedAt = new Date().toISOString();
        recordLogin(store, {
          userId: user.id,
          email,
          success: false,
          reason: "wrong_password",
          ip,
          userAgent: ua
        });
        writeAuthStore(store);
        res.status(401).json({
          error: locked
            ? "Too many failed attempts. Account temporarily locked. Try again in 15 minutes."
            : "Invalid email or password.",
          code: locked ? "ACCOUNT_LOCKED" : "INVALID_CREDENTIALS"
        });
        return;
      }

      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = user.lastLoginAt;

      const tokens = issueSession(store, user, req, rememberMe);
      recordLogin(store, { userId: user.id, email, success: true, reason: "ok", ip, userAgent: ua });
      audit(store, "user.login", user.id, { rememberMe });
      writeAuthStore(store);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken, rememberMe);

      res.json({
        success: true,
        user: publicUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: ACCESS_TTL_SEC
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Server error during login.", code: "SERVER_ERROR" });
    }
  });

  router.post("/logout", (req, res) => {
    try {
      const store = readAuthStore();
      const token = getBearerOrCookie(req);
      const payload = token ? verifyAccessToken(token) : null;
      if (payload) {
        store.sessions = store.sessions.map((session) =>
          session.id === payload.sid
            ? { ...session, revokedAt: new Date().toISOString() }
            : session
        );
        audit(store, "user.logout", payload.sub, {});
        writeAuthStore(store);
      }
      clearAuthCookies(res);
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      clearAuthCookies(res);
      res.status(500).json({ error: "Server error during logout.", code: "SERVER_ERROR" });
    }
  });

  router.post("/refresh-token", (req, res) => {
    try {
      const store = readAuthStore();
      const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
      const refreshToken = String(req.body?.refreshToken || cookies?.key_refresh || "");
      if (!refreshToken) {
        res.status(401).json({ error: "Refresh token required.", code: "NO_REFRESH_TOKEN" });
        return;
      }

      const tokenHash = hashToken(refreshToken);
      const session = store.sessions.find(
        (item) => item.refreshTokenHash === tokenHash && !item.revokedAt
      );
      if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
        res.status(401).json({ error: "Refresh token expired.", code: "REFRESH_EXPIRED" });
        return;
      }

      const user = findUserById(store, session.userId);
      if (!user || user.status !== "active") {
        res.status(401).json({ error: "Account unavailable.", code: "ACCOUNT_UNAVAILABLE" });
        return;
      }

      session.revokedAt = new Date().toISOString();
      const tokens = issueSession(store, user, req, session.rememberMe);
      writeAuthStore(store);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken, session.rememberMe);

      res.json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: ACCESS_TTL_SEC,
        user: publicUser(user)
      });
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(500).json({ error: "Server error refreshing session.", code: "SERVER_ERROR" });
    }
  });

  router.get("/me", requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: req.authUser });
  });

  router.put("/profile", requireAuth, (req: AuthedRequest, res) => {
    try {
      const store = readAuthStore();
      const user = findUserById(store, req.authUser!.id);
      if (!user) {
        res.status(404).json({ error: "User not found." });
        return;
      }
      if (typeof req.body?.firstName === "string") user.firstName = req.body.firstName.trim();
      if (typeof req.body?.lastName === "string") user.lastName = req.body.lastName.trim();
      if (typeof req.body?.companyName === "string") user.companyName = req.body.companyName.trim();
      if (typeof req.body?.businessName === "string") user.businessName = req.body.businessName.trim();
      if (typeof req.body?.phone === "string") user.phone = req.body.phone.trim();
      if (typeof req.body?.country === "string") user.country = req.body.country.trim();
      if (typeof req.body?.avatarUrl === "string") user.avatarUrl = req.body.avatarUrl;
      if (typeof req.body?.newsletterOptIn === "boolean") user.newsletterOptIn = req.body.newsletterOptIn;
      if (typeof req.body?.preferredDnsProvider === "string") {
        user.preferredDnsProvider = req.body.preferredDnsProvider.trim().toLowerCase() || null;
      }
      user.updatedAt = new Date().toISOString();
      audit(store, "user.profile_update", user.id, {});
      writeAuthStore(store);
      res.json({ success: true, user: publicUser(user) });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Server error updating profile.", code: "SERVER_ERROR" });
    }
  });

  router.post("/change-password", requireAuth, (req: AuthedRequest, res) => {
    try {
      const store = readAuthStore();
      const user = findUserById(store, req.authUser!.id);
      if (!user) {
        res.status(404).json({ error: "User not found.", code: "USER_NOT_FOUND" });
        return;
      }
      const currentPassword = String(req.body?.currentPassword || "");
      const password = String(req.body?.password || "");
      const confirmPassword = String(req.body?.confirmPassword || "");

      if (user.passwordHash && user.passwordSalt) {
        if (!currentPassword || !verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)) {
          res.status(401).json({ error: "Current password is incorrect.", code: "WRONG_PASSWORD" });
          return;
        }
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        res.status(400).json({ error: passwordError, code: "VALIDATION_ERROR" });
        return;
      }
      if (password !== confirmPassword) {
        res.status(400).json({ error: "Passwords do not match.", code: "PASSWORD_MISMATCH" });
        return;
      }

      const { salt, hash } = hashPassword(password);
      user.passwordHash = hash;
      user.passwordSalt = salt;
      user.updatedAt = new Date().toISOString();
      store.sessions = store.sessions.map((session) =>
        session.userId === user.id && session.id !== req.sessionId
          ? { ...session, revokedAt: new Date().toISOString() }
          : session
      );
      audit(store, "user.change_password", user.id, {});
      writeAuthStore(store);
      res.json({ success: true, message: "Password updated." });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Server error changing password.", code: "SERVER_ERROR" });
    }
  });

  router.delete("/account", requireAuth, (req: AuthedRequest, res) => {
    try {
      const store = readAuthStore();
      const user = findUserById(store, req.authUser!.id);
      if (!user) {
        res.status(404).json({ error: "User not found." });
        return;
      }
      user.status = "deleted";
      user.updatedAt = new Date().toISOString();
      store.sessions = store.sessions.map((session) =>
        session.userId === user.id ? { ...session, revokedAt: new Date().toISOString() } : session
      );
      audit(store, "user.delete", user.id, {});
      writeAuthStore(store);
      clearAuthCookies(res);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Server error deleting account.", code: "SERVER_ERROR" });
    }
  });

  router.post("/forgot-password", async (req, res) => {
    try {
      const email = normalizeEmail(String(req.body?.email || ""));
      if (!email || !isValidEmailFormat(email)) {
        res.status(400).json({ error: "Please enter a valid registered email address.", code: "INVALID_EMAIL" });
        return;
      }

      let store: AuthStoreShape;
      try {
        store = readAuthStore();
      } catch (storeErr) {
        console.error("readAuthStore error in forgot-password:", storeErr);
        store = emptyAuthStore();
      }

      try {
        const rate = checkRateLimit(store, `forgot:${clientIp(req)}:${email}`, 10, 60_000);
        if (!rate.allowed) {
          writeAuthStore(store);
          res.status(429).json({ error: "Too many reset requests. Please wait a moment before trying again.", code: "RATE_LIMITED" });
          return;
        }
      } catch (rateErr) {
        console.warn("checkRateLimit ignored error:", rateErr);
      }

      let user = findUserByEmail(store, email);
      if (!user) {
        try {
          const recovered = await fetchAuthUserByEmailFromSupabase(email);
          if (recovered) {
            user = recovered;
            Object.assign(store, readAuthStore());
            user = findUserByEmail(store, email) || recovered;
          }
        } catch (recoverErr) {
          console.error("fetchAuthUserByEmailFromSupabase error:", recoverErr);
        }
      }

      if (!user || user.status === "deleted") {
        res.status(404).json({
          error: `No registered account found with "${email}". Please check for spelling mistakes or create a new account.`,
          code: "USER_NOT_FOUND"
        });
        return;
      }

      let resetToken = randomToken(32);
      let emailDelivered = false;

      if (!Array.isArray(store.passwordResetTokens)) {
        store.passwordResetTokens = [];
      }
      store.passwordResetTokens = store.passwordResetTokens.filter(
        (item) => item.email !== email || item.usedAt !== null
      );
      store.passwordResetTokens.unshift({
        id: createId("reset"),
        userId: user.id,
        email: user.email,
        otpHash: hashToken(resetToken),
        tokenHash: hashToken(resetToken),
        attempts: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
        usedAt: null
      });

      try {
        audit(store, "user.forgot_password", user.id, {});
      } catch (auditErr) {
        console.error("audit log error:", auditErr);
      }

      const hostHeader = (req.headers["x-forwarded-host"] || req.headers["x-original-host"] || req.headers.host);
      const protoHeader = (req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http"));
      const clientOrigin = typeof hostHeader === "string" && hostHeader.trim()
        ? `${protoHeader}://${hostHeader.trim()}`
        : appOrigin();

      try {
        const mailResult = await sendPasswordResetLink(email, resetToken, clientOrigin);
        emailDelivered = Boolean(mailResult?.delivered);
      } catch (mailErr) {
        console.error("sendPasswordResetLink error:", mailErr);
        emailDelivered = false;
      }

      try {
        writeAuthStore(store);
        void flushRootStore().catch((err) => console.error("flush after forgot-password:", err));
      } catch (writeErr) {
        console.error("writeAuthStore error:", writeErr);
      }

      const resetUrl = `${clientOrigin}/?view=reset&token=${resetToken}&email=${encodeURIComponent(email)}`;

      res.json({
        success: true,
        message: emailDelivered
          ? "Check your email! We have sent a password reset link to your email address."
          : "Password reset link generated. You can also proceed directly below to update your password.",
        emailDelivered,
        resetToken,
        resetUrl
      });
    } catch (error) {
      console.error("Forgot password unexpected error:", error);
      res.status(500).json({
        error: "Server error processing password reset request.",
        code: "SERVER_ERROR"
      });
    }
  });

  router.post("/verify-reset-otp", (req, res) => {
    try {
      const store = readAuthStore();
      const email = normalizeEmail(String(req.body?.email || ""));
      const otp = String(req.body?.otp || "").trim();

      if (!email || !isValidEmailFormat(email)) {
        res.status(400).json({ error: "Please enter a valid email address.", code: "INVALID_EMAIL" });
        return;
      }

      if (!otp) {
        res.status(400).json({ error: "Verification token or code required.", code: "INVALID_OTP_FORMAT" });
        return;
      }

      const tokenHashVal = hashToken(otp);
      const tokens = Array.isArray(store.passwordResetTokens) ? store.passwordResetTokens : [];
      const record = tokens.find(
        (item) =>
          item.email === email &&
          !item.usedAt &&
          new Date(item.expiresAt).getTime() > Date.now() &&
          (item.tokenHash === tokenHashVal || item.otpHash === tokenHashVal)
      );
      if (!record) {
        res.status(400).json({ error: "Verification link expired or not found. Please request a new link.", code: "OTP_EXPIRED" });
        return;
      }
      res.json({ success: true, message: "Verification confirmed." });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ error: "Server error verifying code.", code: "SERVER_ERROR" });
    }
  });

  router.post("/reset-password", async (req, res) => {
    try {
      const store = readAuthStore();
      const email = normalizeEmail(String(req.body?.email || ""));
      const resetToken = String(req.body?.resetToken || req.body?.token || req.body?.otp || "").trim();
      const password = String(req.body?.password || "");
      const confirmPassword = String(req.body?.confirmPassword || "");

      if (!email || !isValidEmailFormat(email)) {
        res.status(400).json({ error: "Please enter a valid email address.", code: "INVALID_EMAIL" });
        return;
      }
      if (!resetToken) {
        res.status(400).json({ error: "Reset link token is missing. Please click the link sent to your email.", code: "MISSING_TOKEN" });
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        res.status(400).json({ error: passwordError, code: "VALIDATION_ERROR" });
        return;
      }
      if (password !== confirmPassword) {
        res.status(400).json({ error: "Passwords do not match.", code: "PASSWORD_MISMATCH" });
        return;
      }

      const tokenHashVal = hashToken(resetToken);
      const tokens = Array.isArray(store.passwordResetTokens) ? store.passwordResetTokens : [];
      const record = tokens.find(
        (item) =>
          item.email === email &&
          !item.usedAt &&
          new Date(item.expiresAt).getTime() > Date.now() &&
          (item.tokenHash === tokenHashVal || item.otpHash === tokenHashVal)
      );
      if (!record) {
        res.status(400).json({ error: "Invalid or expired password reset link. Please request a new link.", code: "TOKEN_INVALID" });
        return;
      }

      let user = findUserById(store, record.userId) || findUserByEmail(store, email);
      if (!user) {
        const recovered = await fetchAuthUserByEmailFromSupabase(email);
        if (recovered) {
          user = recovered;
          Object.assign(store, readAuthStore());
          user = findUserById(store, record.userId) || findUserByEmail(store, email) || recovered;
        }
      }

      if (!user) {
        res.status(404).json({ error: "User account not found.", code: "USER_NOT_FOUND" });
        return;
      }

      const { salt, hash } = hashPassword(password);
      user.passwordHash = hash;
      user.passwordSalt = salt;
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      user.updatedAt = new Date().toISOString();
      record.usedAt = new Date().toISOString();
      if (Array.isArray(store.sessions)) {
        store.sessions = store.sessions.map((session) =>
          session.userId === user.id ? { ...session, revokedAt: new Date().toISOString() } : session
        );
      }
      try {
        audit(store, "user.reset_password", user.id, {});
      } catch (auditErr) {
        console.error("audit log error:", auditErr);
      }
      writeAuthStore(store);
      void flushRootStore().catch((err) => console.error("flush after reset-password:", err));

      res.json({ success: true, message: "Password updated successfully! You can now sign in with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Server error resetting password.", code: "SERVER_ERROR" });
    }
  });

  router.post("/verify-email", (req, res) => {
    try {
      const store = readAuthStore();
      const token = String(req.body?.token || "").trim();
      if (!token) {
        res.status(400).json({ error: "Verification token is required.", code: "TOKEN_REQUIRED" });
        return;
      }
      const record = store.emailVerificationTokens.find((item) => item.tokenHash === hashToken(token));
      if (!record) {
        res.status(400).json({ error: "Invalid verification token.", code: "TOKEN_INVALID" });
        return;
      }
      const user = findUserById(store, record.userId);
      if (user?.emailVerified || record.usedAt) {
        res.status(400).json({ error: "Email is already verified.", code: "ALREADY_VERIFIED" });
        return;
      }
      if (new Date(record.expiresAt).getTime() < Date.now()) {
        res.status(400).json({ error: "Verification token has expired.", code: "TOKEN_EXPIRED" });
        return;
      }
      if (!user) {
        res.status(404).json({ error: "User not found.", code: "USER_NOT_FOUND" });
        return;
      }
      user.emailVerified = true;
      user.isVerified = true;
      user.updatedAt = new Date().toISOString();
      record.usedAt = new Date().toISOString();
      audit(store, "user.verify_email", user.id, {});
      writeAuthStore(store);
      res.json({
        success: true,
        message: "Email verified. You can sign in now.",
        user: publicUser(user)
      });
    } catch (error) {
      console.error("Verify email error:", error);
      res.status(500).json({ error: "Server error verifying email.", code: "SERVER_ERROR" });
    }
  });

  router.post("/resend-verification", async (req, res) => {
    try {
      const store = readAuthStore();
      const email = normalizeEmail(String(req.body?.email || ""));
      const rate = checkRateLimit(store, `resend:${clientIp(req)}:${email}`, 5, 60_000);
      if (!rate.allowed) {
        writeAuthStore(store);
        res.status(429).json({ error: "Too many requests. Try again later.", code: "RATE_LIMITED" });
        return;
      }
      if (!email || !isValidEmailFormat(email)) {
        writeAuthStore(store);
        res.status(400).json({ error: "Enter a valid email address.", code: "INVALID_EMAIL" });
        return;
      }
      const user = findUserByEmail(store, email);
      if (!user) {
        writeAuthStore(store);
        res.json({ success: true, message: "If an account exists, a verification email was sent." });
        return;
      }
      if (user.emailVerified) {
        writeAuthStore(store);
        res.status(400).json({ error: "Email is already verified.", code: "ALREADY_VERIFIED" });
        return;
      }
      const verifyToken = randomToken(32);
      store.emailVerificationTokens.unshift({
        id: createId("verify"),
        userId: user.id,
        email: user.email,
        tokenHash: hashToken(verifyToken),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + VERIFY_TTL_MS).toISOString(),
        usedAt: null
      });
      audit(store, "user.resend_verification", user.id, {});
      writeAuthStore(store);
      await sendVerificationEmail(email, verifyToken);
      res.json({
        success: true,
        message: "Verification email sent.",
        verificationToken: shouldExposeAuthTokens() ? verifyToken : undefined
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Server error resending verification.", code: "SERVER_ERROR" });
    }
  });

  async function completeOAuthLogin(
    req: Request,
    res: Response,
    provider: "google" | "github",
    profile: { id: string; email: string; name: string; avatarUrl: string },
    rememberMe = true
  ) {
    const store = readAuthStore();
    if (!profile.email || !isValidEmailFormat(profile.email) || isDisposableEmail(profile.email)) {
      res.status(400).json({
        error: "OAuth provider did not return a valid email.",
        code: "OAUTH_EMAIL_REQUIRED"
      });
      return;
    }

    const email = normalizeEmail(profile.email);
    let oauth = store.oauthAccounts.find(
      (item) => item.provider === provider && item.providerUserId === profile.id
    );
    let user = oauth ? findUserById(store, oauth.userId) : findUserByEmail(store, email);
    const isNewUser = !user;

    if (!user) {
      const names = profile.name.trim().split(/\s+/);
      const now = new Date().toISOString();
      user = {
        id: createId("user"),
        email,
        passwordHash: null,
        passwordSalt: null,
        firstName: names[0] || provider,
        lastName: names.slice(1).join(" ") || "User",
        companyName: "",
        businessName: "",
        phone: "",
        country: "",
        avatarUrl: profile.avatarUrl || "",
        plan: "Free Plan",
        isVerified: true,
        emailVerified: true,
        status: "active",
        mfaEnabled: false,
        newsletterOptIn: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now
      };
      store.users.unshift(user);
    } else {
      if (user.status === "deleted" || user.status === "blocked" || user.status === "inactive") {
        const loginable = assertAccountLoginable(user);
        if (loginable.ok === false) {
          writeAuthStore(store);
          res.status(loginable.status).json({ error: loginable.error, code: loginable.code });
          return;
        }
      }
      user.emailVerified = true;
      user.isVerified = true;
      if (profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = user.lastLoginAt;
    }

    if (!oauth) {
      oauth = {
        id: createId("oauth"),
        userId: user.id,
        provider,
        providerUserId: profile.id,
        email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        createdAt: new Date().toISOString()
      };
      store.oauthAccounts.unshift(oauth);
    }

    const tokens = issueSession(store, user, req, rememberMe);
    recordLogin(store, {
      userId: user.id,
      email,
      success: true,
      reason: `oauth_${provider}`,
      ip: clientIp(req),
      userAgent: userAgent(req)
    });
    audit(store, `user.oauth_${provider}`, user.id, {});
    writeAuthStore(store);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, rememberMe);

    res.json({
      success: true,
      user: publicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: ACCESS_TTL_SEC,
      isNewUser
    });
  }

  router.post("/google-login", async (req, res) => {
    try {
      const idToken = String(req.body?.idToken || "");
      const accessToken = String(req.body?.accessToken || "");
      const rememberMe = req.body?.rememberMe !== false;
      const googleClientId = process.env.GOOGLE_CLIENT_ID;

      if (googleClientId && (idToken || accessToken)) {
        const endpoint = idToken
          ? `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
          : `https://www.googleapis.com/oauth2/v3/userinfo`;
        const response = await fetch(endpoint, {
          headers: accessToken && !idToken ? { Authorization: `Bearer ${accessToken}` } : undefined
        });
        if (!response.ok) {
          res.status(401).json({ error: "Google authentication failed.", code: "OAUTH_FAILED" });
          return;
        }
        const profile = (await response.json()) as Record<string, string>;
        if (idToken) {
          const aud = String(profile.aud || "");
          if (aud !== googleClientId) {
            res.status(401).json({ error: "Google token audience mismatch.", code: "OAUTH_FAILED" });
            return;
          }
          if (profile.email_verified === "false") {
            res.status(401).json({ error: "Google email is not verified.", code: "OAUTH_FAILED" });
            return;
          }
        }
        await completeOAuthLogin(
          req,
          res,
          "google",
          {
            id: String(profile.sub || profile.id),
            email: String(profile.email || ""),
            name: String(profile.name || profile.email || "Google User"),
            avatarUrl: String(profile.picture || "")
          },
          rememberMe
        );
        return;
      }

      if (!allowDevOAuth()) {
        res.status(503).json({
          error: "Google Sign-In is not configured. Set GOOGLE_CLIENT_ID.",
          code: "OAUTH_NOT_CONFIGURED"
        });
        return;
      }

      const email = normalizeEmail(String(req.body?.email || ""));
      if (!email || !isValidEmailFormat(email)) {
        res.status(400).json({
          error: "Email is required for development Google login.",
          code: "VALIDATION_ERROR"
        });
        return;
      }
      const name = String(req.body?.name || "Google User");
      const avatarUrl = String(req.body?.avatarUrl || defaultAvatarUrlForEmail(email));
      await completeOAuthLogin(
        req,
        res,
        "google",
        {
          id: String(req.body?.providerUserId || `google_${hashToken(email).slice(0, 12)}`),
          email,
          name,
          avatarUrl
        },
        rememberMe
      );
    } catch (error) {
      console.error("Google login error:", error);
      res.status(500).json({ error: "Google login failed.", code: "OAUTH_FAILED" });
    }
  });

  router.post("/github-login", async (req, res) => {
    try {
      const code = String(req.body?.code || "");
      const rememberMe = req.body?.rememberMe !== false;
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (clientId && clientSecret && code) {
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: `${appOrigin()}/`
          })
        });
        const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
        if (!tokenJson.access_token) {
          res.status(401).json({
            error: tokenJson.error || "GitHub authorization failed.",
            code: "OAUTH_FAILED"
          });
          return;
        }
        const profileRes = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${tokenJson.access_token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "KEYLINK360"
          }
        });
        const profile = (await profileRes.json()) as Record<string, unknown>;
        let email = String(profile.email || "");
        if (!email) {
          const emailsRes = await fetch("https://api.github.com/user/emails", {
            headers: {
              Authorization: `Bearer ${tokenJson.access_token}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "KEYLINK360"
            }
          });
          const emails = (await emailsRes.json()) as Array<{
            email: string;
            primary: boolean;
            verified: boolean;
          }>;
          email = emails.find((item) => item.primary && item.verified)?.email || emails[0]?.email || "";
        }
        await completeOAuthLogin(
          req,
          res,
          "github",
          {
            id: String(profile.id),
            email,
            name: String(profile.name || profile.login || "GitHub User"),
            avatarUrl: String(profile.avatar_url || "")
          },
          rememberMe
        );
        return;
      }

      if (!allowDevOAuth()) {
        res.status(503).json({
          error: "GitHub Sign-In is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
          code: "OAUTH_NOT_CONFIGURED"
        });
        return;
      }

      const email = normalizeEmail(String(req.body?.email || ""));
      if (!email || !isValidEmailFormat(email)) {
        res.status(400).json({
          error: "Email is required for development GitHub login.",
          code: "VALIDATION_ERROR"
        });
        return;
      }
      const name = String(req.body?.name || "GitHub User");
      const avatarUrl = String(req.body?.avatarUrl || defaultAvatarUrlForEmail(email));
      await completeOAuthLogin(
        req,
        res,
        "github",
        {
          id: String(req.body?.providerUserId || `github_${hashToken(email).slice(0, 12)}`),
          email,
          name,
          avatarUrl
        },
        rememberMe
      );
    } catch (error) {
      console.error("GitHub login error:", error);
      res.status(500).json({ error: "GitHub login failed.", code: "OAUTH_FAILED" });
    }
  });

  return router;
}
