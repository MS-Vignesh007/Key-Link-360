import nodemailer from "nodemailer";

const APP_NAME = "KEYLINK360";

function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function exposeTokens() {
  if (process.env.AUTH_EXPOSE_TOKENS === "true") return true;
  if (process.env.AUTH_EXPOSE_TOKENS === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export function shouldExposeAuthTokens() {
  return exposeTokens();
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

/** Email verification is required only when explicitly enabled, or when SMTP can deliver mail. */
export function requireEmailVerification() {
  if (process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true") return true;
  if (process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "false") return false;
  return isSmtpConfigured();
}

function smtpConfigured() {
  return isSmtpConfigured();
}

async function getTransport() {
  if (!smtpConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
  });
}

async function sendMail(input: { to: string; subject: string; text: string; html: string }) {
  const transport = await getTransport();
  if (!transport) {
    console.log(`[auth:mail] SMTP not configured — email to ${input.to}`);
    console.log(`[auth:mail] Subject: ${input.subject}`);
    console.log(`[auth:mail] ${input.text}`);
    return { delivered: false as const };
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html
  });
  return { delivered: true as const };
}

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${appUrl()}/?verifyToken=${encodeURIComponent(token)}`;
  const subject = `${APP_NAME} — Verify your email`;
  const text = `Verify your ${APP_NAME} account:\n\n${link}\n\nOr use this token: ${token}\n\nThis link expires in 24 hours.`;
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px">${APP_NAME}</h2>
      <p>Confirm your email to activate your account.</p>
      <p><a href="${link}" style="display:inline-block;background:#312ecb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Verify email</a></p>
      <p style="font-size:12px;color:#64748b">Or paste this token: <code>${token}</code></p>
      <p style="font-size:12px;color:#64748b">Expires in 24 hours.</p>
    </div>
  `;
  return sendMail({ to: email, subject, text, html });
}

export async function sendPasswordResetOtp(email: string, otp: string) {
  const subject = `${APP_NAME} — Password reset code`;
  const text = `Your ${APP_NAME} password reset code is: ${otp}\n\nThis code expires in 15 minutes. If you did not request a reset, ignore this email.`;
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px">${APP_NAME}</h2>
      <p>Use this code to reset your password:</p>
      <p style="font-size:28px;letter-spacing:0.35em;font-weight:700;margin:16px 0">${otp}</p>
      <p style="font-size:12px;color:#64748b">Expires in 15 minutes.</p>
    </div>
  `;
  return sendMail({ to: email, subject, text, html });
}
