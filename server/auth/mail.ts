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

/** Check if SMTP configuration has been provided via environment variables. */
export function isSmtpConfigured(): boolean {
  const service = process.env.SMTP_SERVICE?.trim();
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return Boolean(service || host || (user && pass));
}

/** Email verification is required only when explicitly enabled via AUTH_REQUIRE_EMAIL_VERIFICATION="true". */
export function requireEmailVerification() {
  return process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true";
}

function getSmtpTransportConfig() {
  const service = process.env.SMTP_SERVICE?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  let host = process.env.SMTP_HOST?.trim();

  // Auto-detect Gmail host if user provides a Gmail address without explicit host
  if (!host && !service && user && user.toLowerCase().endsWith("@gmail.com")) {
    host = "smtp.gmail.com";
  }

  const port = Number(process.env.SMTP_PORT || (process.env.SMTP_SECURE === "true" ? 465 : 587));
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const from = process.env.SMTP_FROM?.trim() || user || `"${APP_NAME}" <noreply@keylink360.com>`;

  if (service) {
    return {
      transport: {
        service,
        auth: user && pass ? { user, pass } : undefined
      },
      from
    };
  }

  if (host) {
    return {
      transport: {
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
        tls: {
          rejectUnauthorized: false
        }
      },
      from
    };
  }

  return null;
}

async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ delivered: boolean; error?: string }> {
  const smtp = getSmtpTransportConfig();
  if (!smtp) {
    console.log(`[auth:mail] SMTP not configured — logging email to console`);
    console.log(`[auth:mail] To: ${input.to}`);
    console.log(`[auth:mail] Subject: ${input.subject}`);
    console.log(`[auth:mail] Text content:\n${input.text}`);
    return { delivered: false, error: "SMTP credentials not configured on server" };
  }

  try {
    const transporter = nodemailer.createTransport(smtp.transport);
    await transporter.sendMail({
      from: smtp.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html
    });
    console.log(`[auth:mail] Successfully dispatched email to ${input.to}`);
    return { delivered: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[auth:mail] SMTP failed to send email to ${input.to}:`, msg);
    return { delivered: false, error: msg };
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${appUrl()}/?verifyToken=${encodeURIComponent(token)}`;
  const subject = `${APP_NAME} — Verify your email`;
  const text = `Verify your ${APP_NAME} account:\n\n${link}\n\nOr use this token: ${token}\n\nThis link expires in 24 hours.`;
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background-color:#0b0f19;color:#f8fafc;padding:36px 20px;border-radius:12px;max-width:540px;margin:0 auto;border:1px solid #1e293b">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#00f0ff;margin:0;font-size:24px;font-weight:800;letter-spacing:2px">${APP_NAME}</h1>
        <p style="color:#94a3b8;font-size:13px;margin-top:4px">Account Email Verification</p>
      </div>
      <div style="background-color:#0f172a;padding:24px;border-radius:10px;border:1px solid #334155;text-align:center;margin-bottom:24px">
        <p style="color:#e2e8f0;font-size:14px;margin-bottom:20px">Click the button below to verify your email address and activate your account:</p>
        <a href="${link}" style="display:inline-block;background:#00f0ff;color:#0b0f19;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;letter-spacing:0.5px;box-shadow:0 0 20px rgba(0,240,255,0.4)">VERIFY EMAIL ADDRESS</a>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #1e293b">
          <p style="font-size:12px;color:#94a3b8;margin:0 0 6px">Or copy your verification token:</p>
          <code style="background:#1e293b;color:#00f0ff;padding:6px 12px;border-radius:6px;font-size:13px;word-break:break-all">${token}</code>
        </div>
      </div>
      <p style="font-size:12px;color:#64748b;text-align:center;margin:0">This link and token will expire in 24 hours.</p>
    </div>
  `;
  return sendMail({ to: email, subject, text, html });
}

export async function sendPasswordResetLink(email: string, resetToken: string, originUrl?: string) {
  const base = (originUrl || appUrl()).replace(/\/$/, "");
  const resetLink = `${base}/login?resetToken=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`;
  const subject = `${APP_NAME} — Reset Your Password`;
  const text = `Reset your ${APP_NAME} password by opening the link below:\n\n${resetLink}\n\nThis link will expire in 15 minutes.\n\nIf you did not request a password reset, you can safely ignore this email.`;
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background-color:#0b0f19;color:#f8fafc;padding:36px 20px;border-radius:12px;max-width:540px;margin:0 auto;border:1px solid #1e293b">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#00f0ff;margin:0;font-size:24px;font-weight:800;letter-spacing:2px">${APP_NAME}</h1>
        <p style="color:#94a3b8;font-size:13px;margin-top:4px">Password Reset Request</p>
      </div>
      <div style="background-color:#0f172a;padding:28px 24px;border-radius:10px;border:1px solid #334155;text-align:center;margin-bottom:24px">
        <p style="color:#e2e8f0;font-size:15px;margin:0 0 22px;line-height:1.5">You requested to reset your ${APP_NAME} account password. Click the button below to create your new password:</p>
        <a href="${resetLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#00f0ff 0%,#7000ff 100%);color:#ffffff;font-weight:700;padding:14px 30px;border-radius:8px;text-decoration:none;font-size:15px;letter-spacing:1px;box-shadow:0 0 25px rgba(0,240,255,0.4)">RESET PASSWORD</a>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1e293b;text-align:left">
          <p style="font-size:12px;color:#94a3b8;margin:0 0 8px">Or copy and paste this link into your browser:</p>
          <a href="${resetLink}" style="color:#00f0ff;font-size:12px;word-break:break-all;text-decoration:underline">${resetLink}</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:18px;margin-bottom:0">⏱️ This link will expire in <strong>15 minutes</strong>.</p>
      </div>
      <p style="color:#64748b;font-size:12px;line-height:1.6;text-align:center;margin:0 0 16px">
        If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
      <div style="border-top:1px solid #1e293b;padding-top:16px;text-align:center;color:#475569;font-size:11px">
        &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
      </div>
    </div>
  `;
  return sendMail({ to: email, subject, text, html });
}

export async function sendPasswordResetOtp(email: string, otp: string) {
  const subject = `${APP_NAME} — Your Password Reset Code: ${otp}`;
  const text = `Your ${APP_NAME} password reset verification code is: ${otp}\n\nThis code will expire in 15 minutes.\n\nIf you did not request a password reset, please ignore this email.`;
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background-color:#0b0f19;color:#f8fafc;padding:36px 20px;border-radius:12px;max-width:540px;margin:0 auto;border:1px solid #1e293b">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#00f0ff;margin:0;font-size:24px;font-weight:800;letter-spacing:2px">${APP_NAME}</h1>
        <p style="color:#94a3b8;font-size:13px;margin-top:4px">Password Reset Verification</p>
      </div>
      <div style="background-color:#0f172a;padding:24px;border-radius:10px;border:1px solid #334155;text-align:center;margin-bottom:24px">
        <p style="color:#e2e8f0;font-size:14px;margin-bottom:16px">Use the 6-digit verification code below to reset your KEYLINK360 account password:</p>
        <div style="background-color:#1e293b;color:#00f0ff;font-family:Consolas,Monaco,monospace;font-size:36px;font-weight:700;letter-spacing:8px;padding:16px 24px;border-radius:8px;display:inline-block;border:1px solid rgba(0,240,255,0.35);box-shadow:0 0 25px rgba(0,240,255,0.25);margin:8px 0">
          ${otp}
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px;margin-bottom:0">⏱️ This code will expire in <strong>15 minutes</strong>.</p>
      </div>
      <p style="color:#64748b;font-size:12px;line-height:1.6;text-align:center;margin:0 0 16px">
        If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
      <div style="border-top:1px solid #1e293b;padding-top:16px;text-align:center;color:#475569;font-size:11px">
        &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
      </div>
    </div>
  `;
  return sendMail({ to: email, subject, text, html });
}
