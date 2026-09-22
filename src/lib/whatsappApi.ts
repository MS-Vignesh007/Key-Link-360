export interface WhatsAppConfigData {
  phoneNumberId: string;
  wabaId?: string;
  accessToken: string;
  verifyToken: string;
  connected?: boolean;
  connectedPhone?: string;
  verifiedName?: string;
  qualityRating?: string;
  aiAutoReplyEnabled: boolean;
  aiSystemPrompt?: string;
  businessName?: string;
  businessDescription?: string;
  welcomeMessage?: string;
  fallbackMessage?: string;
  orderAlertsEnabled?: boolean;
  leadAlertPhone?: string;
  webhookUrl?: string;
  updatedAt?: string;
}

export interface WhatsAppMessageItem {
  id: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  senderName?: string;
  body: string;
  timestamp: string;
  status: "sent" | "delivered" | "read" | "failed" | "received";
  aiGenerated?: boolean;
  mediaUrl?: string;
  mediaType?: string;
  wamid?: string;
  error?: string;
}

export async function fetchWhatsAppConfig(): Promise<WhatsAppConfigData | null> {
  try {
    const res = await fetch("/api/whatsapp/config", { credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Fetch WhatsApp config failed:", err);
    return null;
  }
}

export async function saveWhatsAppConfigApi(
  config: Partial<WhatsAppConfigData>
): Promise<{ success: boolean; config?: WhatsAppConfigData; error?: string }> {
  try {
    const res = await fetch("/api/whatsapp/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || "Failed to save configuration." };
    return { success: true, config: data.config };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to save configuration." };
  }
}

export async function testWhatsAppConnectionApi(
  phoneNumberId: string,
  accessToken: string
): Promise<{ success: boolean; displayPhoneNumber?: string; verifiedName?: string; qualityRating?: string; error?: string }> {
  try {
    const res = await fetch("/api/whatsapp/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phoneNumberId, accessToken })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to test connection." };
  }
}

export async function fetchWhatsAppMessagesApi(): Promise<WhatsAppMessageItem[]> {
  try {
    const res = await fetch("/api/whatsapp/messages", { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.error("Fetch WhatsApp messages failed:", err);
    return [];
  }
}

export async function sendWhatsAppMessageApi(
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string; messageRecord?: WhatsAppMessageItem }> {
  try {
    const res = await fetch("/api/whatsapp/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ to, text })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || "Failed to send message." };
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to send message." };
  }
}

export async function testWhatsAppAiReplyApi(
  userMessage: string,
  senderName?: string,
  customPrompt?: string,
  businessName?: string,
  businessDescription?: string
): Promise<{ success: boolean; reply?: string; error?: string }> {
  try {
    const res = await fetch("/api/whatsapp/test-ai-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        userMessage,
        senderName,
        customPrompt,
        businessName,
        businessDescription
      })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to test AI reply." };
  }
}

export interface WebWhatsAppSessionData {
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
  antiSpamEnabled?: boolean;
  minDelaySeconds?: number;
  maxDelaySeconds?: number;
  dailyMessageLimit?: number;
  dailyMessagesSent?: number;
  lastResetDate?: string;
}

export async function fetchWebWhatsAppSessionApi(): Promise<WebWhatsAppSessionData | null> {
  try {
    const res = await fetch("/api/whatsapp/web-session/status", { credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Fetch web session failed:", err);
    return null;
  }
}

export async function startWebWhatsAppSessionApi(): Promise<WebWhatsAppSessionData | null> {
  try {
    const res = await fetch("/api/whatsapp/web-session/start", {
      method: "POST",
      credentials: "include"
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Start web session failed:", err);
    return null;
  }
}

export async function confirmWebWhatsAppLinkApi(
  phoneNumber: string,
  displayName?: string
): Promise<{ success: boolean; session?: WebWhatsAppSessionData; error?: string }> {
  try {
    const res = await fetch("/api/whatsapp/web-session/confirm-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phoneNumber, displayName })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to confirm link." };
  }
}

export async function updateWebWhatsAppSettingsApi(settings: {
  antiSpamEnabled?: boolean;
  minDelaySeconds?: number;
  maxDelaySeconds?: number;
  dailyMessageLimit?: number;
}): Promise<{ success: boolean; session?: WebWhatsAppSessionData; error?: string }> {
  try {
    const res = await fetch("/api/whatsapp/web-session/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update settings." };
  }
}

export async function disconnectWebWhatsAppSessionApi(): Promise<{ success: boolean; session?: WebWhatsAppSessionData; error?: string }> {
  try {
    const res = await fetch("/api/whatsapp/web-session/disconnect", {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to disconnect." };
  }
}

export async function simulateInboundWebMessageApi(
  textBody: string,
  senderName?: string,
  fromPhone?: string
): Promise<{ success: boolean; reply?: string; contactCaptured?: boolean; delayAppliedMs?: number; limitReached?: boolean; error?: string }> {
  try {
    const res = await fetch("/api/whatsapp/web-session/simulate-inbound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ textBody, senderName, fromPhone })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to simulate message." };
  }
}

