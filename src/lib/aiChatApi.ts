import { apiUrl } from "./apiBase";
import type { BioAiAssistantSettings, BioEditorBlock } from "../types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface SendBioChatParams {
  pageId: string;
  pageTitle: string;
  pageSlug?: string;
  pageBio?: string;
  ownerUserId?: string;
  aiSettings?: BioAiAssistantSettings;
  blocks?: BioEditorBlock[];
  messages: Array<{ role: string; content: string }>;
  visitorInfo?: { name?: string; phone?: string; email?: string };
}

export async function sendBioChatMessage(params: SendBioChatParams): Promise<{
  reply: string;
  leadCaptured?: boolean;
  capturedLeadId?: string;
}> {
  // Extract summaries from blocks for rich contextual AI awareness
  const products: string[] = [];
  let contactPhone = params.aiSettings?.contactPhone || "";
  let contactEmail = params.aiSettings?.contactEmail || "";

  for (const block of params.blocks || []) {
    if (block.type === "Shop" || block.type === "Product") {
      products.push(block.label || block.value);
    }
    if (block.type === "WhatsApp" && !contactPhone && block.value) {
      const num = block.value.replace(/[^0-9]/g, "");
      if (num) contactPhone = num;
    }
    if (block.type === "Button" && block.label) {
      products.push(`${block.label}: ${block.value}`);
    }
  }

  const businessContext = {
    botName: params.aiSettings?.botName || "AI Assistant",
    businessName: params.aiSettings?.businessName || params.pageTitle,
    businessDescription: params.aiSettings?.businessDescription || params.pageBio || "",
    customFaqs: params.aiSettings?.customFaqs || [],
    contactPhone: contactPhone,
    contactEmail: contactEmail,
    blocksSummary: products.join("; ")
  };

  const response = await fetch(apiUrl("/api/ai/bio-chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pageId: params.pageId,
      pageTitle: params.pageTitle,
      pageSlug: params.pageSlug || "",
      pageBio: params.pageBio || "",
      ownerUserId: params.ownerUserId,
      businessContext,
      messages: params.messages,
      visitorInfo: params.visitorInfo
    })
  });

  if (!response.ok) {
    throw new Error("Failed to communicate with AI Assistant.");
  }

  return response.json();
}

export async function submitChatLead(params: {
  name: string;
  phone: string;
  email?: string;
  pageId: string;
  pageTitle: string;
  pageSlug?: string;
  notes?: string;
  ownerUserId?: string;
}): Promise<{ success: boolean }> {
  const response = await fetch(apiUrl("/api/ai/capture-lead"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw new Error("Failed to submit lead details.");
  }

  return response.json();
}
