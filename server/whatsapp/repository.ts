import { getRootStore, setRootStore } from "../db/rootStore";
import { WhatsAppCloudConfig, WhatsAppMessageRecord } from "./types";

const DEFAULT_VERIFY_TOKEN = "keylink_wa_verify_sec_" + Math.random().toString(36).substring(2, 10);

const DEFAULT_SYSTEM_PROMPT = `You are the friendly, helpful, and professional WhatsApp Sales & Support Assistant for this business.
Your goals:
1. Warmly answer customer questions about products, pricing, operating hours, and services.
2. Recommend relevant products or links and guide visitors to complete purchases.
3. Keep responses concise, conversational, and nicely formatted for WhatsApp (use *bold* for emphasis, bullet points, and cheerful emojis).
4. If a customer is ready to buy or needs custom assistance, encourage them to share their name/email or request human callback.`;

export function getDefaultWhatsAppConfig(userId?: string): WhatsAppCloudConfig {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    wabaId: process.env.WHATSAPP_WABA_ID || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || DEFAULT_VERIFY_TOKEN,
    connected: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN),
    connectedPhone: process.env.WHATSAPP_PHONE_NUMBER || "",
    verifiedName: process.env.WHATSAPP_BUSINESS_NAME || "KEYLINK360 Business",
    aiAutoReplyEnabled: true,
    aiSystemPrompt: DEFAULT_SYSTEM_PROMPT,
    businessName: "KEYLINK360 Store",
    businessDescription: "Premium online store and digital storefront powered by KEYLINK360.",
    welcomeMessage: "Hello! 👋 Thanks for reaching out to us. How can we help you today?",
    fallbackMessage: "Thanks for your message! Our team will get back to you shortly. Feel free to browse our full catalog at our bio link.",
    orderAlertsEnabled: true,
    updatedAt: new Date().toISOString()
  };
}

export function getWhatsAppConfig(userId?: string): WhatsAppCloudConfig {
  const root = getRootStore();
  const owner = userId || "local";
  const workspaces = (root.workspaces as Record<string, any>) || {};
  const ws = workspaces[owner] || {};

  if (ws.whatsAppConfig) {
    return {
      ...getDefaultWhatsAppConfig(userId),
      ...ws.whatsAppConfig
    };
  }

  // Fallback to global config if available
  const globalConfig = (root.whatsAppConfig as WhatsAppCloudConfig) || null;
  if (globalConfig) {
    return {
      ...getDefaultWhatsAppConfig(userId),
      ...globalConfig
    };
  }

  return getDefaultWhatsAppConfig(userId);
}

export async function saveWhatsAppConfig(
  userId: string,
  config: Partial<WhatsAppCloudConfig>
): Promise<WhatsAppCloudConfig> {
  const root = getRootStore();
  const owner = userId || "local";
  const current = getWhatsAppConfig(owner);
  const updated: WhatsAppCloudConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString()
  };

  const workspaces = (root.workspaces as Record<string, any>) || {};
  const ws = workspaces[owner] || {};
  ws.whatsAppConfig = updated;
  workspaces[owner] = ws;

  await setRootStore({
    ...root,
    workspaces
  });

  return updated;
}

export function findConfigByPhoneNumberId(phoneNumberId: string): { userId: string; config: WhatsAppCloudConfig } | null {
  const root = getRootStore();
  const cleanId = String(phoneNumberId || "").trim();
  if (!cleanId) return null;

  const workspaces = (root.workspaces as Record<string, any>) || {};
  for (const [uid, ws] of Object.entries(workspaces)) {
    const cfg = ws?.whatsAppConfig as WhatsAppCloudConfig | undefined;
    if (cfg && cfg.phoneNumberId && cfg.phoneNumberId.trim() === cleanId) {
      return { userId: uid, config: cfg };
    }
  }

  // Check global or default config
  const globalCfg = getWhatsAppConfig("local");
  if (globalCfg.phoneNumberId && globalCfg.phoneNumberId.trim() === cleanId) {
    return { userId: "local", config: globalCfg };
  }

  return null;
}

export function findConfigByVerifyToken(token: string): { userId: string; config: WhatsAppCloudConfig } | null {
  const root = getRootStore();
  const cleanToken = String(token || "").trim();
  if (!cleanToken) return null;

  const workspaces = (root.workspaces as Record<string, any>) || {};
  for (const [uid, ws] of Object.entries(workspaces)) {
    const cfg = ws?.whatsAppConfig as WhatsAppCloudConfig | undefined;
    if (cfg && cfg.verifyToken && cfg.verifyToken.trim() === cleanToken) {
      return { userId: uid, config: cfg };
    }
  }

  // Fallback to default
  const defaultCfg = getWhatsAppConfig("local");
  if (defaultCfg.verifyToken && defaultCfg.verifyToken.trim() === cleanToken) {
    return { userId: "local", config: defaultCfg };
  }

  return null;
}

export function listWhatsAppMessages(userId?: string, limit = 50): WhatsAppMessageRecord[] {
  const root = getRootStore();
  const owner = userId || "local";
  const workspaces = (root.workspaces as Record<string, any>) || {};
  const ws = workspaces[owner] || {};
  const messages: WhatsAppMessageRecord[] = ws.whatsAppMessages || root.whatsAppMessages || [];

  return [...messages]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export async function logWhatsAppMessage(
  userId: string,
  message: Omit<WhatsAppMessageRecord, "id">
): Promise<WhatsAppMessageRecord> {
  const root = getRootStore();
  const owner = userId || "local";
  const workspaces = (root.workspaces as Record<string, any>) || {};
  const ws = workspaces[owner] || {};
  const messages: WhatsAppMessageRecord[] = ws.whatsAppMessages || [];

  const record: WhatsAppMessageRecord = {
    ...message,
    id: `wam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ownerUserId: owner,
    timestamp: message.timestamp || new Date().toISOString()
  };

  messages.unshift(record);
  if (messages.length > 200) {
    messages.length = 200; // Keep latest 200 messages
  }

  ws.whatsAppMessages = messages;
  workspaces[owner] = ws;

  await setRootStore({
    ...root,
    workspaces
  });

  return record;
}
