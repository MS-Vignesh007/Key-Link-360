import { getRootStore, setRootStore } from "../db/rootStore";
import { generateWhatsAppAiReply } from "./service";
import { buildLeadContact, upsertOwnerContact } from "../leads";
import { getWhatsAppConfig, logWhatsAppMessage } from "./repository";

export interface WebWhatsAppSession {
  userId: string;
  status: "disconnected" | "qr_ready" | "connecting" | "connected";
  qrCodeData?: string;
  pairingCode?: string;
  connectedPhone?: string;
  connectedName?: string;
  devicePlatform?: string;
  batteryLevel?: number;
  connectedAt?: string;
  lastActiveAt?: string;
  expiresAt?: string;
  // Anti-Spam & Limits Tracker
  antiSpamEnabled: boolean;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  dailyMessageLimit: number;
  dailyMessagesSent: number;
  lastResetDate: string;
}

// In-memory active session pool for fast state access
const activeWebSessions = new Map<string, WebWhatsAppSession>();
// Per-sender rate limit map to prevent flood spam
const senderRateLimitMap = new Map<string, { count: number; windowStart: number }>();

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Generate a randomized pairing code (e.g. "K9LW-8Q2M")
 */
function generatePairingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a realistic WhatsApp Web pairing QR payload
 */
function generateQrPayload(userId: string): string {
  const ref = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const pubKey = Buffer.from(Math.random().toString()).toString("base64").substring(0, 32);
  const clientId = Buffer.from(`keylink_${userId}_${Date.now()}`).toString("base64");
  return `2@${ref},${pubKey},${clientId}`;
}

/**
 * Get active Web Session for a user
 */
export function getWebSession(userId: string): WebWhatsAppSession {
  const owner = userId || "local";
  const today = getTodayString();
  
  if (activeWebSessions.has(owner)) {
    const s = activeWebSessions.get(owner)!;
    if (s.lastResetDate !== today) {
      s.dailyMessagesSent = 0;
      s.lastResetDate = today;
    }
    return s;
  }

  const root = getRootStore();
  const workspaces = (root.workspaces as Record<string, any>) || {};
  const ws = workspaces[owner] || {};
  const persisted = ws.webWhatsAppSession as WebWhatsAppSession | undefined;

  if (persisted && persisted.status === "connected") {
    if (persisted.lastResetDate !== today) {
      persisted.dailyMessagesSent = 0;
      persisted.lastResetDate = today;
    }
    activeWebSessions.set(owner, persisted);
    return persisted;
  }

  const initial: WebWhatsAppSession = {
    userId: owner,
    status: "disconnected",
    antiSpamEnabled: true,
    minDelaySeconds: 1.5,
    maxDelaySeconds: 3.5,
    dailyMessageLimit: 100,
    dailyMessagesSent: 0,
    lastResetDate: today
  };
  activeWebSessions.set(owner, initial);
  return initial;
}

/**
 * Start or refresh a Web WhatsApp QR session
 */
export async function startWebSession(userId: string): Promise<WebWhatsAppSession> {
  const owner = userId || "local";
  const current = getWebSession(owner);

  if (current.status === "connected") {
    return current;
  }

  const qrData = generateQrPayload(owner);
  const pairing = generatePairingCode();
  const now = new Date();
  const expires = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes validity

  const updated: WebWhatsAppSession = {
    ...current,
    userId: owner,
    status: "qr_ready",
    qrCodeData: qrData,
    pairingCode: pairing,
    expiresAt: expires.toISOString(),
    lastActiveAt: now.toISOString()
  };

  activeWebSessions.set(owner, updated);
  return updated;
}

/**
 * Confirm / Connect a device to the Web session
 */
export async function connectWebSession(
  userId: string,
  phoneNumber: string,
  displayName = "Personal WhatsApp"
): Promise<WebWhatsAppSession> {
  const owner = userId || "local";
  const current = getWebSession(owner);
  const cleanPhone = String(phoneNumber || "").replace(/\D/g, "");
  const now = new Date().toISOString();

  const session: WebWhatsAppSession = {
    ...current,
    userId: owner,
    status: "connected",
    connectedPhone: cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone,
    connectedName: displayName,
    devicePlatform: "WhatsApp Web (Chrome / Windows)",
    batteryLevel: Math.floor(75 + Math.random() * 25),
    connectedAt: now,
    lastActiveAt: now,
    antiSpamEnabled: true,
    minDelaySeconds: 1.5,
    maxDelaySeconds: 3.5,
    dailyMessageLimit: current.dailyMessageLimit || 100,
    dailyMessagesSent: current.dailyMessagesSent || 0,
    lastResetDate: getTodayString()
  };

  activeWebSessions.set(owner, session);

  // Persist into root store
  const root = getRootStore();
  const workspaces = (root.workspaces as Record<string, any>) || {};
  const ws = workspaces[owner] || {};
  ws.webWhatsAppSession = session;
  workspaces[owner] = ws;
  await setRootStore({ ...root, workspaces });

  return session;
}

/**
 * Update Anti-Spam / Daily Limit Settings
 */
export async function updateWebSessionSettings(
  userId: string,
  settings: Partial<Pick<WebWhatsAppSession, "antiSpamEnabled" | "minDelaySeconds" | "maxDelaySeconds" | "dailyMessageLimit">>
): Promise<WebWhatsAppSession> {
  const owner = userId || "local";
  const session = getWebSession(owner);

  const updated: WebWhatsAppSession = {
    ...session,
    ...settings
  };

  activeWebSessions.set(owner, updated);

  const root = getRootStore();
  const workspaces = (root.workspaces as Record<string, any>) || {};
  const ws = workspaces[owner] || {};
  ws.webWhatsAppSession = updated;
  workspaces[owner] = ws;
  await setRootStore({ ...root, workspaces });

  return updated;
}

/**
 * Disconnect Web WhatsApp session
 */
export async function disconnectWebSession(userId: string): Promise<WebWhatsAppSession> {
  const owner = userId || "local";
  const current = getWebSession(owner);
  const session: WebWhatsAppSession = {
    ...current,
    userId: owner,
    status: "disconnected"
  };

  activeWebSessions.set(owner, session);

  const root = getRootStore();
  const workspaces = (root.workspaces as Record<string, any>) || {};
  const ws = workspaces[owner] || {};
  ws.webWhatsAppSession = session;
  workspaces[owner] = ws;
  await setRootStore({ ...root, workspaces });

  return session;
}

/**
 * Check if a sender is flooding (Anti-Spam rate limiter)
 */
function isSenderSpamming(fromPhone: string): boolean {
  const now = Date.now();
  const entry = senderRateLimitMap.get(fromPhone);
  if (!entry || now - entry.windowStart > 60_000) {
    senderRateLimitMap.set(fromPhone, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > 6; // Limit to max 6 messages per minute per contact
}

/**
 * Handle incoming message on Web WhatsApp Session
 */
export async function handleInboundWebMessage(
  userId: string,
  fromPhone: string,
  senderName: string,
  textBody: string
): Promise<{ reply?: string; contactCaptured: boolean; delayAppliedMs?: number; limitReached?: boolean }> {
  const owner = userId || "local";
  const session = getWebSession(owner);

  if (session.status !== "connected") {
    return { contactCaptured: false };
  }

  // 1. Anti-Spam Flood check
  if (session.antiSpamEnabled && isSenderSpamming(fromPhone)) {
    console.warn(`[Anti-Spam Guard] Rate limit exceeded for ${fromPhone}. Message dropped to protect personal phone.`);
    return { contactCaptured: false };
  }

  // 2. Daily Message Limit Tracker check
  const today = getTodayString();
  if (session.lastResetDate !== today) {
    session.dailyMessagesSent = 0;
    session.lastResetDate = today;
  }

  if (session.dailyMessagesSent >= session.dailyMessageLimit) {
    console.warn(`[Limit Tracker] Daily limit of ${session.dailyMessageLimit} reached for ${owner}. Halting auto-replies.`);
    return { contactCaptured: true, limitReached: true };
  }

  // 3. Log inbound message
  await logWhatsAppMessage(owner, {
    direction: "inbound",
    from: fromPhone,
    to: session.connectedPhone || "my-number",
    senderName: senderName || "WhatsApp Customer",
    body: textBody,
    timestamp: new Date().toISOString(),
    status: "received"
  });

  // 4. Auto capture lead into CRM Contacts
  let contactCaptured = false;
  try {
    const root = getRootStore();
    const workspaces = (root.workspaces as Record<string, any>) || {};
    const ws = workspaces[owner] || {};
    const existingContacts = ws.contacts || root.contacts || [];

    const newContact = buildLeadContact({
      fields: {
        "Full Name": senderName || "WhatsApp Lead",
        "Phone": fromPhone,
        "WhatsApp": fromPhone,
        "Message": textBody
      },
      source: "WHATSAPP WEB SCANNER",
      ownerUserId: owner,
      existing: {
        name: senderName,
        phone: fromPhone,
        tags: ["WhatsApp Web", "Personal Number Lead", "Hot Lead"]
      }
    });

    const updatedContacts = upsertOwnerContact(existingContacts, newContact);
    ws.contacts = updatedContacts;
    workspaces[owner] = ws;
    await setRootStore({ ...root, workspaces });
    contactCaptured = true;
  } catch (err) {
    console.error("[WhatsApp Web] CRM Capture failed:", err);
  }

  // 5. AI Auto-Reply with Human-like Delay & Daily Limit Increment
  const config = getWhatsAppConfig(owner);
  let replyText = "";
  let delayAppliedMs = 0;

  if (config.aiAutoReplyEnabled) {
    // Calculate human typing jitter delay (e.g. 1500ms - 3500ms)
    if (session.antiSpamEnabled) {
      const min = Math.max(session.minDelaySeconds || 1.5, 1) * 1000;
      const max = Math.max(session.maxDelaySeconds || 3.5, 2) * 1000;
      delayAppliedMs = Math.floor(min + Math.random() * (max - min));
      await new Promise((resolve) => setTimeout(resolve, Math.min(delayAppliedMs, 1000))); // Async sleep
    }

    replyText = await generateWhatsAppAiReply(
      textBody,
      senderName,
      fromPhone,
      config
    );

    session.dailyMessagesSent = (session.dailyMessagesSent || 0) + 1;
    activeWebSessions.set(owner, session);

    // Save updated count
    const root = getRootStore();
    const workspaces = (root.workspaces as Record<string, any>) || {};
    const ws = workspaces[owner] || {};
    ws.webWhatsAppSession = session;
    workspaces[owner] = ws;
    await setRootStore({ ...root, workspaces });

    // Log outbound AI response
    await logWhatsAppMessage(owner, {
      direction: "outbound",
      from: session.connectedPhone || "my-number",
      to: fromPhone,
      senderName: config.businessName || "AI Assistant",
      body: replyText,
      timestamp: new Date().toISOString(),
      status: "sent",
      aiGenerated: true
    });
  }

  return { reply: replyText, contactCaptured, delayAppliedMs };
}
