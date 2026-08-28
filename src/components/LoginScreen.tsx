import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  Building2,
  Phone,
  Globe2, QrCode,
  User,
  Cpu,
  Zap,
  KeyRound,
  ShieldCheck,
  Radio,
  Sparkles,
  Terminal,
  Fingerprint
} from "lucide-react";
import {
  AuthApiError,
  AuthConfig,
  AuthUser,
  createPreviewAuthUser,
  enterPreviewSession,
  fetchAuthConfig,
  forgotPasswordRequest,
  isAuthPreviewDisabled,
  isAuthPreviewForced,
  loginRequest,
  passwordStrengthRequest,
  probeAuthBackend,
  registerRequest,
  resendVerificationRequest,
  resetPasswordRequest,
  saveAuthSession,
  verifyEmailRequest,
  verifyResetOtpRequest
} from "../lib/authApi";
import KeyLogo3D from "./KeyLogo3D";
import WelcomeModal from "./WelcomeModal";

type AuthView =
  | "login"
  | "register"
  | "forgot"
  | "otp"
  | "reset"
  | "reset-success"
  | "verify"
  | "verify-success"
  | "register-success";

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  initialView?: AuthView;
  initialVerifyToken?: string;
}

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "India",
  "Canada",
  "Australia",
  "Germany",
  "United Arab Emirates",
  "Singapore",
  "Other"
];

const DISPOSABLE = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "10minutemail.com",
  "yopmail.com",
  "trashmail.com"
]);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function isDisposable(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  return DISPOSABLE.has(domain);
}

function validatePasswordClient(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password must be at most 128 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include letters and numbers.";
  }
  return null;
}

function loginErrorMessage(err: AuthApiError): string {
  switch (err.code) {
    case "ACCOUNT_LOCKED":
      return err.message || "Account temporarily locked after too many failed attempts.";
    case "ACCOUNT_BLOCKED":
      return "This account is blocked. Contact support for help.";
    case "ACCOUNT_INACTIVE":
      return "This account is inactive. Contact support to reactivate.";
    case "ACCOUNT_DELETED":
      return "This account has been deleted.";
    case "RATE_LIMITED":
      return "Too many attempts. Please wait a moment and try again.";
    case "EMAIL_UNVERIFIED":
      return "Please verify your email before signing in.";
    case "NETWORK_ERROR":
      return "Network error. Check your connection and try again.";
    case "SERVER_ERROR":
      return "Server error. Please try again shortly.";
    default:
      return err.message || "Unable to sign in.";
  }
}

export default function LoginScreen({
  onLoginSuccess,
  initialView = "login",
  initialVerifyToken = ""
}: LoginScreenProps) {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const modeParam = searchParams.get("mode") || searchParams.get("view");
  const handleParam = searchParams.get("handle") || "";

  const [view, setView] = useState<AuthView>(() => {
    if (initialVerifyToken) return "verify";
    if (modeParam === "register" || modeParam === "signup") return "register";
    if (modeParam === "reset" || modeParam === "forgot") return "reset";
    return initialView;
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyToken, setVerifyToken] = useState(initialVerifyToken);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "fair" | "good" | "strong" | "">("");
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(isAuthPreviewForced() && !isAuthPreviewDisabled());
  const [welcomeUser, setWelcomeUser] = useState<AuthUser | null>(null);
  const autoVerifyDone = useRef(false);

  const [firstName, setFirstName] = useState(handleParam);
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessName, setBusinessName] = useState(handleParam);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United States");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthSurface() {
      if (isAuthPreviewDisabled()) {
        setPreviewMode(false);
        try {
          const cfg = await fetchAuthConfig();
          if (!cancelled) setConfig(cfg);
        } catch {
          if (!cancelled) setConfig(null);
        }
        return;
      }

      if (isAuthPreviewForced()) {
        setPreviewMode(true);
      }

      const backendOk = await probeAuthBackend();
      if (cancelled) return;

      if (backendOk) {
        setPreviewMode(isAuthPreviewForced());
        try {
          const cfg = await fetchAuthConfig();
          if (!cancelled) setConfig(cfg);
        } catch {
          if (!cancelled) setConfig(null);
        }
      } else {
        setPreviewMode(true);
        setConfig(null);
      }
    }

    void loadAuthSurface();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialVerifyToken || autoVerifyDone.current) return;
    autoVerifyDone.current = true;
    setView("verify");
    setLoading(true);
    verifyEmailRequest(initialVerifyToken)
      .then(() => {
        setView("verify-success");
      })
      .catch((err: unknown) => {
        setError((err as AuthApiError).message || "Verification link is invalid or has expired.");
      })
      .finally(() => setLoading(false));
  }, [initialVerifyToken]);

  useEffect(() => {
    if (!password || (view !== "register" && view !== "reset")) {
      setPasswordStrength("");
      return;
    }
    const timer = window.setTimeout(() => {
      passwordStrengthRequest(password)
        .then((res) => setPasswordStrength(res.strength))
        .catch(() => {
          if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
            setPasswordStrength("strong");
          } else if (password.length >= 8) {
            setPasswordStrength("good");
          } else {
            setPasswordStrength("weak");
          }
        });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [password, view]);

  const strengthColor = useMemo(() => {
    switch (passwordStrength) {
      case "weak":
        return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]";
      case "fair":
        return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]";
      case "good":
        return "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]";
      case "strong":
        return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]";
      default:
        return "bg-slate-700";
    }
  }, [passwordStrength]);

  const finishLogin = (user: AuthUser, accessToken: string, refreshToken: string, remember: boolean) => {
    saveAuthSession(user, { accessToken, refreshToken }, remember);
    setWelcomeUser(user);
  };

  const finishPreviewLogin = (
    provider: "google" | "github" | "password",
    input?: { email?: string; name?: string }
  ) => {
    const user = createPreviewAuthUser({
      provider,
      email: input?.email,
      name: input?.name
    });
    enterPreviewSession(user, rememberMe);
    setWelcomeUser(user);
  };

  const handleAutoFillDemo = () => {
    setEmail(config?.demoHint?.email || "keylink360@gmail.com");
    setPassword(config?.demoHint?.password || "keyslink3601234");
    setError("");
    setInfo("⚡ KEYCARD DETECTED: Demo credentials auto-filled.");
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setFieldErrors({});

    const trimmedEmail = email.trim().toLowerCase();
    const nextErrors: Record<string, string> = {};

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Please fix the errors below.");
      return;
    }

    if (previewMode) {
      finishPreviewLogin("password", { email: trimmedEmail, name: trimmedEmail.split("@")[0] });
      return;
    }

    setLoading(true);
    try {
      const result = await loginRequest({
        email: trimmedEmail,
        password,
        rememberMe
      });
      if (result.user && result.accessToken && result.refreshToken) {
        finishLogin(result.user, result.accessToken, result.refreshToken, rememberMe);
      } else {
        setError("Invalid authentication response. Please try again.");
      }
    } catch (err) {
      const apiErr = err as AuthApiError;
      if (
        !isAuthPreviewDisabled() &&
        (apiErr.status === 404 ||
          apiErr.code === "NETWORK_ERROR" ||
          apiErr.code === "REQUEST_FAILED" ||
          apiErr.message === "Request failed.")
      ) {
        setPreviewMode(true);
        finishPreviewLogin("password", { email: trimmedEmail, name: trimmedEmail.split("@")[0] });
        return;
      }
      if (apiErr.code === "EMAIL_UNVERIFIED") {
        setError(loginErrorMessage(apiErr));
        setView("verify");
        return;
      }
      setError(loginErrorMessage(apiErr));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setFieldErrors({});

    const trimmedEmail = email.trim().toLowerCase();
    const nextErrors: Record<string, string> = {};

    if (!firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!companyName.trim() && !businessName.trim()) {
      nextErrors.companyName = "Company or business name is required.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    } else if (isDisposable(trimmedEmail)) {
      nextErrors.email = "Disposable email addresses are not accepted.";
    }

    const clientPassError = validatePasswordClient(password);
    if (clientPassError) {
      nextErrors.password = clientPassError;
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!acceptTerms) {
      nextErrors.acceptTerms = "You must accept the Terms of Service.";
    }
    if (!acceptPrivacy) {
      nextErrors.acceptPrivacy = "You must accept the Privacy Policy.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerRequest({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: (companyName || businessName).trim(),
        businessName: (businessName || companyName).trim(),
        phone: phone.trim() || undefined,
        country,
        email: trimmedEmail,
        password,
        confirmPassword,
        acceptTerms,
        acceptPrivacy,
        newsletterOptIn
      });

      if (result.verificationToken && config?.exposeTokens) {
        setVerifyToken(result.verificationToken);
        setInfo(`Dev verification token: ${result.verificationToken}`);
      }

      if (result.user && !result.emailVerificationRequired && result.accessToken && result.refreshToken) {
        finishLogin(result.user, result.accessToken, result.refreshToken, true);
        return;
      }

      setView("register-success");
    } catch (err) {
      const apiErr = err as AuthApiError;
      if (
        !isAuthPreviewDisabled() &&
        (apiErr.status === 404 ||
          apiErr.code === "NETWORK_ERROR" ||
          apiErr.code === "REQUEST_FAILED" ||
          apiErr.message === "Request failed.")
      ) {
        setPreviewMode(true);
        finishPreviewLogin("password", {
          email: trimmedEmail,
          name: `${firstName} ${lastName}`.trim() || trimmedEmail.split("@")[0]
        });
        return;
      }
      setError((err as AuthApiError).message || "Unable to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPasswordRequest(trimmedEmail);
      if (result.otp && config?.exposeTokens) {
        setOtp(result.otp);
        setInfo(`Dev OTP: ${result.otp}`);
      } else {
        setInfo(result.message);
      }
      setView("otp");
    } catch (err) {
      setError((err as AuthApiError).message || "Unable to process password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!otp.trim()) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      await verifyResetOtpRequest(email.trim().toLowerCase(), otp.trim());
      setView("reset");
    } catch (err) {
      setError((err as AuthApiError).message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await forgotPasswordRequest(email.trim().toLowerCase());
      if (result.otp && config?.exposeTokens) {
        setOtp(result.otp);
        setInfo(`New OTP: ${result.otp}`);
      } else {
        setInfo("A new verification code has been dispatched.");
      }
    } catch (err) {
      setError((err as AuthApiError).message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");

    const clientPassError = validatePasswordClient(password);
    if (clientPassError) {
      setError(clientPassError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordRequest({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
        confirmPassword
      });
      setView("reset-success");
    } catch (err) {
      setError((err as AuthApiError).message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!verifyToken.trim()) {
      setError("Paste your verification token or open the link from your email.");
      return;
    }
    setLoading(true);
    try {
      await verifyEmailRequest(verifyToken.trim());
      setView("verify-success");
    } catch (err) {
      setError((err as AuthApiError).message || "Unable to verify email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await resendVerificationRequest(email.trim().toLowerCase());
      if (result.verificationToken && config?.exposeTokens) {
        setVerifyToken(result.verificationToken);
        setInfo(`Dev verification token: ${result.verificationToken}`);
      } else {
        setInfo(result.message);
      }
    } catch (err) {
      setError((err as AuthApiError).message || "Unable to resend verification.");
    } finally {
      setLoading(false);
    }
  };

  const onPasswordKeyEvent = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(event.getModifierState?.("CapsLock") || false);
  };

  const title =
    view === "register" || view === "register-success"
      ? "Create Account"
      : view === "forgot" || view === "otp" || view === "reset" || view === "reset-success"
        ? "Reset Password"
        : view === "verify" || view === "verify-success"
          ? "Verify Email"
          : "Sign In";

  const subtitle =
    view === "login"
      ? "Welcome back! Sign in to access your account."
      : view === "register"
        ? "Create your account to start building your bio pages."
        : view === "forgot"
          ? "Enter your email to receive a password reset code."
          : view === "otp"
            ? "Enter the 6-digit verification code sent to your email."
            : view === "reset"
              ? "Enter a strong new password for your account."
              : view === "verify"
                ? "Confirm your email to activate your account."
                : "You're all set! You can now sign in.";

  const StrengthBar = () =>
    passwordStrength ? (
      <div className="space-y-1.5 pt-1">
        <div className="h-1.5 rounded-full bg-slate-900/80 border border-slate-700/50 overflow-hidden">
          <div
            className={`h-full ${strengthColor} transition-all duration-300`}
            style={{
              width:
                passwordStrength === "weak"
                  ? "25%"
                  : passwordStrength === "fair"
                    ? "50%"
                    : passwordStrength === "good"
                      ? "75%"
                      : "100%"
            }}
          />
        </div>
        <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase flex items-center justify-between">
          <span>Password Strength:</span>
          <span className="font-bold text-cyan-300">{passwordStrength}</span>
        </p>
      </div>
    ) : null;

  if (welcomeUser) {
    return (
      <WelcomeModal
        user={welcomeUser}
        onContinue={() => {
          onLoginSuccess(welcomeUser);
        }}
      />
    );
  }

  return (
    <div 
      style={{ marginTop: "0.7px" }} 
      className="key-auth-canvas min-h-screen w-full flex items-center justify-center py-6 px-3 sm:px-6 select-none relative overflow-x-hidden"
    >
      <div className="key-auth-orb key-auth-orb--1" aria-hidden />
      <div className="key-auth-orb key-auth-orb--2" aria-hidden />
      <div className="key-auth-orb key-auth-orb--3" aria-hidden />
      <div className="key-auth-grid" aria-hidden />
      
      {/* Top-Left Back to Home Button */}
      <a
        href="/"
        className="fixed top-4 left-4 sm:top-5 sm:left-6 z-40 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 text-xs font-semibold border border-slate-700/80 backdrop-blur-xl shadow-lg transition-all group cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Home</span>
      </a>

      {/* 2-Column Balanced Responsive Grid */}
      <div 
        style={{ marginTop: "0.7px" }}
        className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center justify-center relative z-10 my-auto"
      >
        
        {/* ================= LEFT SIDE: ULTRA-CRISP HD BRAND SHOWCASE ================= */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 select-none pr-0 lg:pr-2">
          
          {/* OG Brand Logo (100% untouched original file) */}
          <div className="flex items-center justify-center">
            <img
              src="/vickys-link-og.png"
              alt="Vickys Link 360 Infinity Logo"
              className="w-56 sm:w-64 lg:w-72 h-auto object-contain"
            />
          </div>

          {/* Inspiring Brand Typography */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              The Infinity Key to Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 drop-shadow-[0_0_25px_rgba(0,240,255,0.45)]">
                Digital Success.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed font-normal">
              Step into your unified growth command center. Build high-converting mobile bio pages, dynamic QR codes, traffic rotators, and direct UPI collections.
            </p>
          </div>

          {/* Sub-Title Title Placed Below Paragraph */}
          <div className="pt-1 w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>THE NEXT-GEN BIO & REVENUE PLATFORM</span>
            </div>
          </div>

          {/* 4 Feature Highlights in 2x2 Compact Grid */}
          <div className="grid grid-cols-2 gap-2.5 w-full max-w-md text-left pt-0.5">
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex items-start gap-2 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-bold text-white leading-tight">Instant UPI Payments</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Direct Razorpay settlements</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex items-start gap-2 shadow-sm">
              <QrCode className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-bold text-white leading-tight">Dynamic Vector QR</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Zero-reprint link updates</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex items-start gap-2 shadow-sm">
              <Globe2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-bold text-white leading-tight">Custom Domain + SSL</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Your branded dot-com</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex items-start gap-2 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-bold text-white leading-tight">Traffic Rotators</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Real-time A/B split testing</p>
              </div>
            </div>
          </div>

          {/* Compact Social Proof Badge */}
          <div className="pt-0.5 flex items-center justify-center lg:justify-start gap-1.5 text-[11px] font-medium text-slate-400">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Trusted by 10,000+ creators and sellers worldwide</span>
          </div>
        </div>

        {/* ================= RIGHT SIDE: COMPACT AUTH FORM BOX ================= */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
          <div
            style={{ marginTop: "0.7px" }}
            className="w-full max-w-[450px] key-cyber-panel p-5 sm:p-7 relative z-10 shrink-0 animate-in fade-in duration-200"
          >
            <div className="key-cyber-bracket-tl" aria-hidden />
            <div className="key-cyber-bracket-tr" aria-hidden />
            <div className="key-cyber-bracket-bl" aria-hidden />
            <div className="key-cyber-bracket-br" aria-hidden />

        {/* 3D Transparent Logo & Premium Brand Title */}
        <div className="flex flex-col items-center text-center mb-0">
          <div className="relative flex items-center justify-center mb-4">
            {/* Ambient Hologram Halo Ring */}
            <div className="absolute inset-0 w-44 h-44 -top-6 -left-6 rounded-full bg-radial from-cyan-500/25 via-indigo-600/10 to-transparent blur-xl pointer-events-none" />
            <KeyLogo3D size="lg" variant="full" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight select-none leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_20px_rgba(0,240,255,0.45)]">
              KeyLink
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.55)]">
              360
            </span>
          </h1>
          <p
            style={{ marginTop: "10px" }}
            className="text-xs text-slate-300/80 font-mono tracking-wide mt-[10px] max-w-[360px]"
          >
            {subtitle}
          </p>

          {previewMode && view === "login" && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 border border-amber-300/30 px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              <Sparkles className="h-3 w-3" />
              Client Preview Session
            </p>
          )}
        </div>

        {(view === "login" || view === "register") && (
          <div
            style={{ marginTop: "10px" }}
            className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/70 border border-cyan-500/25 rounded-xl mt-[10px] mb-6 shadow-inner"
          >
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError("");
                setInfo("");
                setView("login");
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 ${
                view === "login"
                  ? "bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              Sign In
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError("");
                setInfo("");
                setView("register");
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 ${
                view === "register"
                  ? "bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              Create Account
            </button>
          </div>
        )}

        {view !== "login" &&
          view !== "register" &&
          view !== "register-success" &&
          view !== "reset-success" &&
          view !== "verify-success" && (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError("");
                setInfo("");
                setView(view === "otp" || view === "reset" ? "forgot" : "login");
              }}
              className="mb-5 inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </button>
          )}

        {error && (
          <div
            className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-start gap-2.5 shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-in fade-in duration-200"
            role="alert"
          >
            <ShieldCheck className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-bold tracking-wider uppercase text-rose-300">[Notice]:</span>{" "}
              {error}
            </div>
          </div>
        )}

        {info && (
          <div
            className="mb-5 p-3.5 rounded-xl bg-cyan-950/50 border border-cyan-400/50 text-cyan-200 text-xs font-mono flex items-start gap-2.5 shadow-[0_0_20px_rgba(0,240,255,0.2)] animate-in fade-in duration-200 break-all"
            role="status"
          >
            <Zap className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 leading-relaxed">
              <span className="font-bold tracking-wider uppercase text-cyan-300">[Status]:</span>{" "}
              {info}
            </div>
          </div>
        )}

        {view === "login" && (
          <>
            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[11px] font-mono font-bold text-cyan-300/90 uppercase tracking-widest mb-1.5"
                >
                  EMAIL ADDRESS
                </label>
                <div className="key-auth-field">
                  <span className="key-auth-field__icon text-cyan-400/80">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email address"
                    aria-invalid={Boolean(fieldErrors.email)}
                    className="key-cyber-input key-auth-input py-2.5 placeholder:text-slate-500 placeholder:text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-[11px] font-mono font-bold text-cyan-300/90 uppercase tracking-widest"
                  >
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setError("");
                      setInfo("");
                      setView("forgot");
                    }}
                    className="text-[11px] font-mono text-cyan-400/80 hover:text-cyan-300 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="key-auth-field">
                  <span className="key-auth-field__icon text-cyan-400/80">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={onPasswordKeyEvent}
                    onKeyUp={onPasswordKeyEvent}
                    placeholder="Enter your password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    className="key-cyber-input key-auth-input key-auth-input--password py-2.5 placeholder:text-slate-500 placeholder:text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((open) => !open)}
                    className="key-auth-field__action text-cyan-400/70 hover:text-cyan-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {capsLockOn && (
                  <p className="mt-1.5 text-[11px] font-mono text-amber-400 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> [WARNING]: Caps Lock is on.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-mono text-slate-300/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="rounded bg-slate-900/80 border-cyan-500/40 text-cyan-500 focus:ring-cyan-400/50"
                  />
                  Remember me on this device
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="key-btn-cyber mt-2"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-cyan-200" />
                    <span>Sign In</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <div className="key-cyber-passcard mt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shrink-0">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                        DEMO ACCOUNT
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        ADMIN
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 mt-0.5">
                      {config?.demoHint?.email || "keylink360@gmail.com"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoFillDemo}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-200 hover:text-white transition-all duration-200 flex items-center gap-1 shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.25)] hover:scale-105 active:scale-95"
                >
                  <Zap className="h-3 w-3 text-cyan-300" />
                  Auto-Fill
                </button>
              </div>
            </div>
          </>
        )}

        {view === "register" && (
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CyberField
                id="reg-first"
                icon={User}
                label="FIRST NAME"
                placeholder="Enter first name"
                value={firstName}
                onChange={setFirstName}
                autoComplete="given-name"
                error={fieldErrors.firstName}
              />
              <CyberField
                id="reg-last"
                icon={User}
                label="LAST NAME"
                placeholder="Enter last name"
                value={lastName}
                onChange={setLastName}
                autoComplete="family-name"
                error={fieldErrors.lastName}
              />
            </div>

            <CyberField
              id="reg-company"
              icon={Building2}
              label="COMPANY / BUSINESS NAME"
              placeholder="Enter company or business name"
              value={companyName}
              onChange={setCompanyName}
              autoComplete="organization"
              error={fieldErrors.companyName}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CyberField
                id="reg-phone"
                icon={Phone}
                label="PHONE NUMBER"
                placeholder="Enter your phone number"
                value={phone}
                onChange={setPhone}
                type="tel"
                autoComplete="tel"
                error={fieldErrors.phone}
              />

              <div>
                <label
                  htmlFor="reg-country"
                  className="block text-[11px] font-mono font-bold text-cyan-300/90 uppercase tracking-widest mb-1.5"
                >
                  COUNTRY / REGION
                </label>
                <div className="key-auth-field">
                  <span className="key-auth-field__icon text-cyan-400/80">
                    <Globe2 className="h-4 w-4" />
                  </span>
                  <select
                    id="reg-country"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className="key-cyber-input key-auth-input py-2.5"
                  >
                    {COUNTRIES.map((item) => (
                      <option key={item} value={item} className="bg-slate-900 text-slate-100">
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <CyberField
              id="reg-email"
              icon={Mail}
              label="EMAIL ADDRESS"
              placeholder="Enter your email address"
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
              error={fieldErrors.email}
            />

            <CyberPasswordField
              id="reg-password"
              label="PASSWORD"
              placeholder="Create a password (min. 8 characters)"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((open) => !open)}
              onKeyEvent={onPasswordKeyEvent}
              autoComplete="new-password"
            />
            {capsLockOn && (
              <p className="text-[11px] font-mono text-amber-400">[WARNING]: Caps Lock is on.</p>
            )}
            <StrengthBar />

            <CyberPasswordField
              id="reg-confirm"
              label="CONFIRM PASSWORD"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((open) => !open)}
              onKeyEvent={onPasswordKeyEvent}
              autoComplete="new-password"
            />

            <div className="space-y-2 pt-2 text-xs font-mono text-slate-300/90">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                  className="mt-0.5 rounded bg-slate-900/80 border-cyan-500/40 text-cyan-500 focus:ring-cyan-400/50"
                />
                <span>
                  I accept the{" "}
                  <a href="/terms" className="text-cyan-300 font-bold hover:underline">
                    Terms of Service
                  </a>
                  .
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(event) => setAcceptPrivacy(event.target.checked)}
                  className="mt-0.5 rounded bg-slate-900/80 border-cyan-500/40 text-cyan-500 focus:ring-cyan-400/50"
                />
                <span>
                  I accept the{" "}
                  <a href="/privacy" className="text-cyan-300 font-bold hover:underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsletterOptIn}
                  onChange={(event) => setNewsletterOptIn(event.target.checked)}
                  className="mt-0.5 rounded bg-slate-900/80 border-cyan-500/40 text-cyan-500 focus:ring-cyan-400/50"
                />
                <span>Receive product updates and news.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="key-btn-cyber mt-4"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Cpu className="h-4 w-4 text-cyan-200" />
                  <span>CREATE ACCOUNT</span>
                </>
              )}
            </button>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-5" noValidate>
            <CyberField
              id="forgot-email"
              icon={Mail}
              label="REGISTERED EMAIL"
              placeholder="Enter your registered email address"
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={loading}
              className="key-btn-cyber"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="h-4 w-4 text-cyan-200" />
                  <span>SEND RESET CODE</span>
                </>
              )}
            </button>
          </form>
        )}

        {view === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="reset-otp"
                className="block text-[11px] font-mono font-bold text-cyan-300/90 uppercase tracking-widest mb-1.5"
              >
                VERIFICATION CODE (OTP)
              </label>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="key-cyber-input py-3 px-4 text-center font-mono text-xl tracking-[0.4em] text-cyan-300 font-bold placeholder:text-slate-500 placeholder:tracking-normal placeholder:text-sm"
                placeholder="Enter 6-digit code"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="key-btn-cyber"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-cyan-200" />
                  <span>VERIFY CODE</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleResendOtp()}
              className="w-full text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 hover:underline disabled:opacity-60 transition-colors"
            >
              Didn&apos;t receive code? Resend Code
            </button>
          </form>
        )}

        {view === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
            <CyberPasswordField
              id="reset-password"
              label="NEW PASSWORD"
              placeholder="Enter new password (min. 8 characters)"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((open) => !open)}
              onKeyEvent={onPasswordKeyEvent}
              autoComplete="new-password"
            />
            {capsLockOn && (
              <p className="text-[11px] font-mono text-amber-400">[WARNING]: Caps Lock is on.</p>
            )}
            <StrengthBar />
            <CyberPasswordField
              id="reset-confirm"
              label="CONFIRM NEW PASSWORD"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((open) => !open)}
              onKeyEvent={onPasswordKeyEvent}
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={loading}
              className="key-btn-cyber"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="h-4 w-4 text-cyan-200" />
                  <span>UPDATE PASSWORD</span>
                </>
              )}
            </button>
          </form>
        )}

        {view === "verify" && (
          <form onSubmit={handleVerifyEmail} className="space-y-5" noValidate>
            <CyberField
              id="verify-email"
              icon={Mail}
              label="ACCOUNT EMAIL"
              placeholder="Enter your account email"
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
            />
            <CyberField
              id="verify-token"
              icon={Lock}
              label="VERIFICATION TOKEN"
              placeholder="Paste verification token"
              value={verifyToken}
              onChange={setVerifyToken}
            />
            <button
              type="submit"
              disabled={loading}
              className="key-btn-cyber"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-cyan-200" />
                  <span>VERIFY EMAIL</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleResendVerification()}
              className="w-full text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 hover:underline disabled:opacity-60 transition-colors"
            >
              Resend verification email
            </button>
          </form>
        )}

        {(view === "register-success" || view === "reset-success" || view === "verify-success") && (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 flex items-center justify-center shadow-[0_0_25px_rgba(0,240,255,0.35)]">
              <CheckCircle className="h-8 w-8 text-cyan-300 animate-pulse" />
            </div>
            <p className="text-sm font-mono text-slate-200 leading-relaxed" role="status">
              {view === "register-success"
                ? config?.emailVerificationRequired
                  ? "Account created. We sent a verification link to your email to activate your account."
                  : "Account created successfully! You can now sign in with your email and password."
                : view === "reset-success"
                  ? "Password updated successfully! You can now sign in with your new password."
                  : "Email verified successfully! You can now sign in."}
            </p>
            {view === "register-success" && config?.emailVerificationRequired && (
              <button
                type="button"
                onClick={() => setView("verify")}
                className="w-full border border-cyan-500/40 rounded-xl py-2.5 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-500/10 transition-colors"
              >
                Enter token manually
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setError("");
                setInfo("");
                setPassword("");
                setView("login");
              }}
              className="key-btn-cyber"
            >
              <Zap className="h-4 w-4 text-cyan-200" />
              <span>BACK TO SIGN IN</span>
            </button>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CyberField({
  id,
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  error
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-mono font-bold text-cyan-300/90 uppercase tracking-widest mb-1.5"
      >
        {label}
      </label>
      <div className="key-auth-field">
        <span className="key-auth-field__icon text-cyan-400/80">
          <Icon className="h-4 w-4" />
        </span>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          className="key-cyber-input key-auth-input py-2.5 placeholder:text-slate-500 placeholder:text-xs"
        />
      </div>
      {error && (
        <p className="mt-1 text-[10px] font-mono text-rose-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

function CyberPasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter your password",
  show,
  onToggle,
  onKeyEvent,
  autoComplete
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  show: boolean;
  onToggle: () => void;
  onKeyEvent?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-mono font-bold text-cyan-300/90 uppercase tracking-widest mb-1.5"
      >
        {label}
      </label>
      <div className="key-auth-field">
        <span className="key-auth-field__icon text-cyan-400/80">
          <Lock className="h-4 w-4" />
        </span>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyEvent}
          onKeyUp={onKeyEvent}
          className="key-cyber-input key-auth-input key-auth-input--password py-2.5 placeholder:text-slate-500 placeholder:text-xs"
        />
        <button
          type="button"
          onClick={onToggle}
          className="key-auth-field__action text-cyan-400/70 hover:text-cyan-300"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
