import { WhatsAppCloudConfig, WhatsAppVerificationResult } from "./types";

/**
 * Sanitize and format phone number for WhatsApp Graph API (E.164 digits without +)
 */
export function formatWhatsAppRecipient(rawPhone: string): string {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  // If user enters standard 10 digit Indian mobile without country code, default to 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Verify credentials with Meta WhatsApp Graph API
 */
export async function verifyWhatsAppCredentials(
  phoneNumberId: string,
  accessToken: string
): Promise<WhatsAppVerificationResult> {
  const cleanId = String(phoneNumberId || "").trim();
  const cleanToken = String(accessToken || "").trim();

  if (!cleanId || !cleanToken) {
    return {
      success: false,
      error: "Phone Number ID and Permanent Access Token are required."
    };
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${cleanId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        "Content-Type": "application/json"
      }
    });

    const data = (await response.json()) as any;

    if (!response.ok || data?.error) {
      const errMsg = data?.error?.message || `Meta Graph API responded with status ${response.status}`;
      return {
        success: false,
        error: errMsg
      };
    }

    return {
      success: true,
      displayPhoneNumber: data.display_phone_number || "",
      verifiedName: data.verified_name || "WhatsApp Business",
      qualityRating: data.quality_rating || "GREEN"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to reach Meta Graph API."
    };
  }
}

/**
 * Send WhatsApp text message via Meta Cloud API
 */
export async function sendWhatsAppTextMessage(
  config: WhatsAppCloudConfig,
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const recipient = formatWhatsAppRecipient(to);
  if (!recipient || recipient.length < 7) {
    return { success: false, error: "Invalid recipient phone number." };
  }

  if (!config.phoneNumberId || !config.accessToken) {
    return { success: false, error: "WhatsApp Cloud API credentials not configured." };
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "text",
    text: {
      preview_url: true,
      body: text
    }
  };

  try {
    const url = `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as any;

    if (!response.ok || data?.error) {
      const errMsg = data?.error?.message || `Failed to send message (${response.status})`;
      console.error("[WhatsApp Cloud API] Send error:", errMsg, data);
      return { success: false, error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (error: any) {
    console.error("[WhatsApp Cloud API] Network send error:", error);
    return { success: false, error: error?.message || "Network error sending WhatsApp message." };
  }
}

/**
 * Send WhatsApp template message via Meta Cloud API
 */
export async function sendWhatsAppTemplateMessage(
  config: WhatsAppCloudConfig,
  to: string,
  templateName: string,
  languageCode = "en_US",
  components: any[] = []
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const recipient = formatWhatsAppRecipient(to);
  if (!recipient || recipient.length < 7) {
    return { success: false, error: "Invalid recipient phone number." };
  }

  if (!config.phoneNumberId || !config.accessToken) {
    return { success: false, error: "WhatsApp Cloud API credentials not configured." };
  }

  const payload = {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      },
      components: components.length ? components : undefined
    }
  };

  try {
    const url = `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as any;

    if (!response.ok || data?.error) {
      const errMsg = data?.error?.message || `Template send failed (${response.status})`;
      return { success: false, error: errMsg };
    }

    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to send template message." };
  }
}

/**
 * Call Google Gemini 1.5 Flash (free tier) for WhatsApp Auto-Reply
 */
async function callGeminiForWhatsApp(
  systemInstruction: string,
  userMessage: string,
  senderName?: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `System Context & Guidelines:\n${systemInstruction}\n\nVisitor Name: ${senderName || "Customer"}\nVisitor Message: "${userMessage}"\n\nProvide an engaging, helpful, and concise WhatsApp reply. Use *bold* for product names/key points and friendly emojis where fitting.`
          }
        ]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
            topP: 0.9
          }
        })
      }
    );

    if (!response.ok) {
      console.warn("[WhatsApp AI] Gemini returned non-200:", response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? String(text).trim() : null;
  } catch (error) {
    console.warn("[WhatsApp AI] Gemini call failed, using smart fallback:", error);
    return null;
  }
}

/**
 * Smart Fallback Auto-Reply NLP Engine for WhatsApp
 */
function generateFallbackWhatsAppReply(
  userMessage: string,
  config: WhatsAppCloudConfig,
  senderName?: string
): string {
  const q = userMessage.toLowerCase().trim();
  const biz = config.businessName || "our store";
  const name = senderName ? ` ${senderName}` : "";

  // Greetings
  if (/^(hi|hello|hey|hola|namaste|good\s*(morning|evening|afternoon)|start)/i.test(q)) {
    return config.welcomeMessage || `Hello${name}! 👋 Thanks for contacting *${biz}*.\n\nHow can we assist you today? Feel free to ask about our products, pricing, or current offers!`;
  }

  // Pricing / Cost inquiries
  if (/price|cost|rate|pricing|how\s*much|discount|offer|deal/i.test(q)) {
    return `Hi${name}! 🏷️ We offer competitive pricing with exclusive deals available on our store.\n\nTo view all items and instant checkout, check out our catalog link! If you need a custom quote, just reply with your requirement.`;
  }

  // Products / Catalog inquiries
  if (/product|catalog|menu|service|items|buy|order|purchase/i.test(q)) {
    return `Hello${name}! 🛍️ You can explore our complete product collection, place instant orders, and track deliveries directly from our bio store.\n\nIs there a specific item you are looking for today?`;
  }

  // Location / Address / Hours
  if (/where|location|address|timing|hours|open|store\s*location/i.test(q)) {
    return `Hi${name}! 📍 We are open and taking orders online 24/7! For physical store hours and directions, please visit our bio link or send us your preferred delivery location.`;
  }

  // Human support / Contact
  if (/human|agent|talk\s*to\s*person|call|support|help|founder|manager/i.test(q)) {
    return `Hi${name}! 👨‍💼 Our team has been notified of your message. A representative from *${biz}* will connect with you here shortly!\n\nIn the meantime, feel free to leave any additional details here.`;
  }

  // Default fallback
  return config.fallbackMessage || `Thanks for reaching out${name}! 🙏 We received your message and will respond right away. How else can *${biz}* help you today?`;
}

/**
 * Main AI Auto-Reply Generator for WhatsApp Inbound Messages
 */
export async function generateWhatsAppAiReply(
  incomingMessage: string,
  senderName: string,
  senderPhone: string,
  config: WhatsAppCloudConfig
): Promise<string> {
  const systemPrompt = `You are the official WhatsApp AI Sales Assistant for ${config.businessName || "KEYLINK360 Business"}.
Business Overview: ${config.businessDescription || "Digital bio pages, online shop, and instant customer engagement platform."}
${config.aiSystemPrompt ? `Additional Instructions: ${config.aiSystemPrompt}` : ""}

Rules for WhatsApp format:
- Keep the response short, clear, and direct (under 3 paragraphs).
- Use *bold* for emphasis.
- Include friendly emojis where natural.
- Help the customer purchase, ask questions, or connect with the business.`;

  const geminiReply = await callGeminiForWhatsApp(systemPrompt, incomingMessage, senderName);
  if (geminiReply) {
    return geminiReply;
  }

  return generateFallbackWhatsAppReply(incomingMessage, config, senderName);
}
