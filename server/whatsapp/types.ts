export interface WhatsAppCloudConfig {
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

export interface WhatsAppMessageRecord {
  id: string;
  ownerUserId?: string;
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

export interface WhatsAppVerificationResult {
  success: boolean;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  error?: string;
}
