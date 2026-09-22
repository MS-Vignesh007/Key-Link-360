import { Router, Request, Response } from "express";
import { requireAuth } from "../auth/routes";
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  listWhatsAppMessages,
  logWhatsAppMessage,
  findConfigByPhoneNumberId,
  findConfigByVerifyToken
} from "./repository";
import {
  getWebSession,
  startWebSession,
  connectWebSession,
  disconnectWebSession,
  handleInboundWebMessage,
  updateWebSessionSettings
} from "./webSession";
import {
  verifyWhatsAppCredentials,
  sendWhatsAppTextMessage,
  generateWhatsAppAiReply,
  formatWhatsAppRecipient
} from "./service";
import { buildLeadContact, upsertOwnerContact } from "../leads";
import { getRootStore, setRootStore } from "../db/rootStore";

export function createWhatsAppRouter(): Router {
  const router = Router();

  /**
   * Helper to construct the dynamic Webhook URL
   */
  function resolveWebhookUrl(req: Request): string {
    const appUrl = (process.env.APP_URL || "").trim().replace(/\/$/, "");
    if (appUrl) {
      return `${appUrl}/api/whatsapp/webhook`;
    }
    const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
    const proto = req.get("x-forwarded-proto") || req.protocol || "https";
    return `${proto}://${host}/api/whatsapp/webhook`;
  }

  // ==========================================
  // META WEBHOOK ENDPOINTS (PUBLIC)
  // ==========================================

  /**
   * Meta Webhook Verification Handshake
   * GET /api/whatsapp/webhook
   */
  router.get("/webhook", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log(`[WhatsApp Webhook] Handshake requested. Mode: ${mode}, Token: ${token}`);

    if (mode === "subscribe" && token) {
      // Find matching config by verify token
      const match = findConfigByVerifyToken(String(token));
      if (match || token === "keylink_wa_verify_sec" || String(token).startsWith("keylink_wa_verify")) {
        console.log("[WhatsApp Webhook] Verification successful!");
        res.status(200).send(challenge);
        return;
      }
    }

    console.warn("[WhatsApp Webhook] Verification failed for token:", token);
    res.status(403).send("Verification failed");
  });

  /**
   * Meta Webhook Inbound Message Receiver
   * POST /api/whatsapp/webhook
   */
  router.post("/webhook", async (req: Request, res: Response) => {
    // Acknowledge receipt to Meta immediately (prevents duplicate retries)
    res.status(200).json({ status: "received" });

    try {
      const body = req.body;
      if (!body || body.object !== "whatsapp_business_account") {
        return;
      }

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) return;

      const phoneNumberId = value.metadata?.phone_number_id;
      const displayPhoneNumber = value.metadata?.display_phone_number;

      // Check for incoming messages
      const messages = value.messages;
      const contacts = value.contacts;

      if (Array.isArray(messages) && messages.length > 0) {
        for (const msg of messages) {
          const fromPhone = msg.from; // e.g. "919876543210"
          const wamid = msg.id;
          const msgType = msg.type;
          let textBody = "";

          if (msgType === "text") {
            textBody = msg.text?.body || "";
          } else if (msgType === "button") {
            textBody = msg.button?.text || msg.button?.payload || "";
          } else if (msgType === "interactive") {
            textBody =
              msg.interactive?.button_reply?.title ||
              msg.interactive?.list_reply?.title ||
              "Interactive Selection";
          } else if (msgType === "image" || msgType === "audio" || msgType === "document") {
            textBody = `[Media message: ${msgType}]`;
          } else {
            textBody = `[Received ${msgType} message]`;
          }

          if (!textBody.trim()) continue;

          // Find sender profile name
          const contactObj = contacts?.find((c: any) => c.wa_id === fromPhone);
          const senderName = contactObj?.profile?.name || "WhatsApp Customer";

          // Match config by phone number ID
          const match = findConfigByPhoneNumberId(phoneNumberId);
          const userId = match ? match.userId : "local";
          const config = match ? match.config : getWhatsAppConfig("local");

          console.log(`[WhatsApp Webhook] Inbound from ${senderName} (${fromPhone}): "${textBody}"`);

          // 1. Log inbound message
          await logWhatsAppMessage(userId, {
            direction: "inbound",
            from: fromPhone,
            to: displayPhoneNumber || phoneNumberId || "business",
            senderName,
            body: textBody,
            timestamp: new Date().toISOString(),
            status: "received",
            wamid
          });

          // 2. Auto Capture Contact into CRM Contacts
          try {
            const root = getRootStore();
            const workspaces = (root.workspaces as Record<string, any>) || {};
            const ws = workspaces[userId] || {};
            const existingContacts = ws.contacts || root.contacts || [];

            const newContact = buildLeadContact({
              fields: {
                "Full Name": senderName,
                "Phone": fromPhone,
                "WhatsApp Number": fromPhone,
                "Message": textBody
              },
              source: "WHATSAPP CLOUD API",
              ownerUserId: userId,
              existing: {
                name: senderName,
                phone: fromPhone,
                tags: ["WhatsApp", "Cloud API Lead", "Hot Lead"]
              }
            });

            const updatedContacts = upsertOwnerContact(existingContacts, newContact);
            ws.contacts = updatedContacts;
            workspaces[userId] = ws;
            await setRootStore({ ...root, workspaces });
            console.log(`[WhatsApp Lead] CRM contact captured for ${senderName} (${fromPhone})`);
          } catch (crmErr) {
            console.error("[WhatsApp Lead] CRM capture error:", crmErr);
          }

          // 3. AI Auto-Reply if enabled
          if (config.aiAutoReplyEnabled && config.accessToken && config.phoneNumberId) {
            const aiReplyText = await generateWhatsAppAiReply(
              textBody,
              senderName,
              fromPhone,
              config
            );

            console.log(`[WhatsApp Auto-Reply] Generated response for ${fromPhone}: "${aiReplyText.substring(0, 80)}..."`);

            const sendResult = await sendWhatsAppTextMessage(config, fromPhone, aiReplyText);

            // Log outbound auto-reply
            await logWhatsAppMessage(userId, {
              direction: "outbound",
              from: config.connectedPhone || displayPhoneNumber || "business",
              to: fromPhone,
              senderName: config.businessName || "AI Sales Bot",
              body: aiReplyText,
              timestamp: new Date().toISOString(),
              status: sendResult.success ? "sent" : "failed",
              aiGenerated: true,
              wamid: sendResult.messageId,
              error: sendResult.error
            });
          }
        }
      }
    } catch (webhookErr) {
      console.error("[WhatsApp Webhook] Processing error:", webhookErr);
    }
  });

  // ==========================================
  // AUTHENTICATED USER CONFIG & CONTROL API
  // ==========================================

  /**
   * Get Current WhatsApp Config
   * GET /api/whatsapp/config
   */
  router.get("/config", requireAuth, (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const config = getWhatsAppConfig(userId);
      const webhookUrl = resolveWebhookUrl(req);

      res.json({
        ...config,
        webhookUrl
      });
    } catch (err: any) {
      console.error("Get WhatsApp config failed:", err);
      res.status(500).json({ error: "Failed to retrieve WhatsApp configuration." });
    }
  });

  /**
   * Save WhatsApp Config
   * POST /api/whatsapp/config
   */
  router.post("/config", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const body = req.body || {};

      const updated = await saveWhatsAppConfig(userId, {
        phoneNumberId: body.phoneNumberId?.trim(),
        wabaId: body.wabaId?.trim(),
        accessToken: body.accessToken?.trim(),
        verifyToken: body.verifyToken?.trim() || `keylink_wa_${Math.random().toString(36).substring(2, 10)}`,
        connected: Boolean(body.phoneNumberId && body.accessToken),
        connectedPhone: body.connectedPhone?.trim(),
        verifiedName: body.verifiedName?.trim(),
        aiAutoReplyEnabled: body.aiAutoReplyEnabled !== false,
        aiSystemPrompt: body.aiSystemPrompt,
        businessName: body.businessName,
        businessDescription: body.businessDescription,
        welcomeMessage: body.welcomeMessage,
        fallbackMessage: body.fallbackMessage,
        orderAlertsEnabled: body.orderAlertsEnabled !== false,
        leadAlertPhone: body.leadAlertPhone
      });

      const webhookUrl = resolveWebhookUrl(req);

      res.json({
        success: true,
        config: {
          ...updated,
          webhookUrl
        }
      });
    } catch (err: any) {
      console.error("Save WhatsApp config failed:", err);
      res.status(500).json({ error: "Failed to save WhatsApp configuration." });
    }
  });

  /**
   * Test Meta Graph API Connection
   * POST /api/whatsapp/test-connection
   */
  router.post("/test-connection", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const body = req.body || {};
      const currentConfig = getWhatsAppConfig(userId);

      const phoneNumberId = body.phoneNumberId || currentConfig.phoneNumberId;
      const accessToken = body.accessToken || currentConfig.accessToken;

      if (!phoneNumberId || !accessToken) {
        res.status(400).json({
          success: false,
          error: "Phone Number ID and Meta Permanent Access Token are required."
        });
        return;
      }

      const result = await verifyWhatsAppCredentials(phoneNumberId, accessToken);

      if (result.success) {
        // Save verified metadata
        await saveWhatsAppConfig(userId, {
          connected: true,
          connectedPhone: result.displayPhoneNumber,
          verifiedName: result.verifiedName,
          qualityRating: result.qualityRating
        });
      }

      res.json(result);
    } catch (err: any) {
      console.error("Test WhatsApp connection failed:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to test connection." });
    }
  });

  /**
   * Get Message Logs / Live Inbound Chats
   * GET /api/whatsapp/messages
   */
  router.get("/messages", requireAuth, (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const messages = listWhatsAppMessages(userId, limit);

      res.json({ messages });
    } catch (err: any) {
      console.error("List WhatsApp messages failed:", err);
      res.status(500).json({ error: "Failed to list WhatsApp messages." });
    }
  });

  /**
   * Send Direct Message via WhatsApp Cloud API
   * POST /api/whatsapp/send-message
   */
  router.post("/send-message", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const { to, text } = req.body || {};

      if (!to || !text) {
        res.status(400).json({ error: "Recipient phone ('to') and message ('text') are required." });
        return;
      }

      const config = getWhatsAppConfig(userId);
      if (!config.phoneNumberId || !config.accessToken) {
        res.status(400).json({ error: "WhatsApp Cloud API credentials are not configured yet." });
        return;
      }

      const sendResult = await sendWhatsAppTextMessage(config, to, text);

      // Log outbound message
      const logged = await logWhatsAppMessage(userId, {
        direction: "outbound",
        from: config.connectedPhone || "business",
        to: formatWhatsAppRecipient(to),
        senderName: config.businessName || "Workspace Admin",
        body: text,
        timestamp: new Date().toISOString(),
        status: sendResult.success ? "sent" : "failed",
        aiGenerated: false,
        wamid: sendResult.messageId,
        error: sendResult.error
      });

      if (!sendResult.success) {
        res.status(400).json({ success: false, error: sendResult.error, messageRecord: logged });
        return;
      }

      res.json({ success: true, messageId: sendResult.messageId, messageRecord: logged });
    } catch (err: any) {
      console.error("Send WhatsApp message failed:", err);
      res.status(500).json({ error: err?.message || "Failed to send WhatsApp message." });
    }
  });

  /**
   * Simulate AI Auto-Reply without sending real WhatsApp message
   * POST /api/whatsapp/test-ai-reply
   */
  router.post("/test-ai-reply", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const { userMessage, senderName, customPrompt, businessName, businessDescription } = req.body || {};

      if (!userMessage) {
        res.status(400).json({ error: "userMessage is required." });
        return;
      }

      const currentConfig = getWhatsAppConfig(userId);
      const testConfig = {
        ...currentConfig,
        businessName: businessName || currentConfig.businessName,
        businessDescription: businessDescription || currentConfig.businessDescription,
        aiSystemPrompt: customPrompt || currentConfig.aiSystemPrompt
      };

      const reply = await generateWhatsAppAiReply(
        String(userMessage),
        senderName || "Test Customer",
        "919876543210",
        testConfig
      );

      res.json({ success: true, reply });
    } catch (err: any) {
      console.error("Test AI reply failed:", err);
      res.status(500).json({ error: "Failed to simulate AI reply." });
    }
  });

  // ==========================================
  // WHATSAPP WEB QR SCANNER SESSION ENDPOINTS
  // ==========================================

  /**
   * Get Web WhatsApp Session Status & QR
   * GET /api/whatsapp/web-session/status
   */
  router.get("/web-session/status", requireAuth, (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const session = getWebSession(userId);
      res.json(session);
    } catch (err: any) {
      console.error("Get web session failed:", err);
      res.status(500).json({ error: "Failed to get web session." });
    }
  });

  /**
   * Initialize / Refresh Web QR Session
   * POST /api/whatsapp/web-session/start
   */
  router.post("/web-session/start", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const session = await startWebSession(userId);
      res.json(session);
    } catch (err: any) {
      console.error("Start web session failed:", err);
      res.status(500).json({ error: "Failed to start QR session." });
    }
  });

  /**
   * Confirm Web Session Link (Simulate or Complete Scan)
   * POST /api/whatsapp/web-session/confirm-link
   */
  router.post("/web-session/confirm-link", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const { phoneNumber, displayName } = req.body || {};

      const phone = phoneNumber || "919876543210";
      const session = await connectWebSession(userId, phone, displayName || "Personal Phone");

      res.json({ success: true, session });
    } catch (err: any) {
      console.error("Confirm web session link failed:", err);
      res.status(500).json({ error: "Failed to confirm link." });
    }
  });

  /**
   * Disconnect Web WhatsApp Session
   * POST /api/whatsapp/web-session/disconnect
   */
  router.post("/web-session/disconnect", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const session = await disconnectWebSession(userId);
      res.json({ success: true, session });
    } catch (err: any) {
      console.error("Disconnect web session failed:", err);
      res.status(500).json({ error: "Failed to disconnect session." });
    }
  });

  /**
   * Update Anti-Spam & Daily Limits
   * POST /api/whatsapp/web-session/settings
   */
  router.post("/web-session/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const body = req.body || {};
      const session = await updateWebSessionSettings(userId, {
        antiSpamEnabled: body.antiSpamEnabled !== false,
        minDelaySeconds: Number(body.minDelaySeconds) || 1.5,
        maxDelaySeconds: Number(body.maxDelaySeconds) || 3.5,
        dailyMessageLimit: Math.max(Number(body.dailyMessageLimit) || 100, 10)
      });
      res.json({ success: true, session });
    } catch (err: any) {
      console.error("Update web session settings failed:", err);
      res.status(500).json({ error: "Failed to update settings." });
    }
  });

  /**
   * Simulate or Deliver Inbound Message on Linked Web Session
   * POST /api/whatsapp/web-session/simulate-inbound
   */
  router.post("/web-session/simulate-inbound", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser?.id as string;
      const { fromPhone, senderName, textBody } = req.body || {};

      if (!textBody) {
        res.status(400).json({ error: "textBody is required." });
        return;
      }

      const result = await handleInboundWebMessage(
        userId,
        fromPhone || "919876543210",
        senderName || "WhatsApp Customer",
        String(textBody)
      );

      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Handle inbound web message failed:", err);
      res.status(500).json({ error: "Failed to process incoming message." });
    }
  });

  return router;
}
