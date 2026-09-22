import { Router, Request, Response } from "express";
import { buildLeadContact, upsertOwnerContact } from "../leads";
import { getRootStore } from "../db/rootStore";

export function createAiRouter(): Router {
  const router = Router();

  /**
   * Helper to call Google Gemini API if key exists
   */
  async function callGeminiApi(systemPrompt: string, userMessage: string, history: Array<{ role: string; content: string }>): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
      const contents = [];

      // Add system prompt as model instruction
      contents.push({
        role: "user",
        parts: [{ text: `System Instruction / Context:\n${systemPrompt}\n\nPlease acknowledge and follow these instructions for all visitor interactions.` }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "Understood! I am ready to represent this business warmly, accurately, and assist visitors with their questions." }]
      });

      // Add conversation history
      for (const msg of history.slice(-6)) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }

      // Add latest message if not in history
      if (!history.length || history[history.length - 1].content !== userMessage) {
        contents.push({
          role: "user",
          parts: [{ text: userMessage }]
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 350,
              topP: 0.9
            }
          })
        }
      );

      if (!response.ok) {
        console.warn("[AI Chat] Gemini API error:", response.status, await response.text());
        return null;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? String(text).trim() : null;
    } catch (err) {
      console.warn("[AI Chat] Gemini call failed, falling back to smart local engine:", err);
      return null;
    }
  }

  /**
   * Fallback Rule-based Smart NLP Engine (when Gemini API key is not configured)
   */
  function generateFallbackAiReply(
    userMessage: string,
    context: {
      botName?: string;
      businessName?: string;
      businessDescription?: string;
      customFaqs?: Array<{ question: string; answer: string }>;
      contactPhone?: string;
      contactEmail?: string;
      pageTitle?: string;
      pageBio?: string;
      productsList?: string[];
    }
  ): string {
    const q = userMessage.toLowerCase().trim();
    const bot = context.botName || "Assistant";
    const biz = context.businessName || context.pageTitle || "our store";
    const phone = context.contactPhone || "";
    const email = context.contactEmail || "";
    const faqs = context.customFaqs || [];

    // 1. Check custom user FAQs for close matches
    for (const faq of faqs) {
      const faqQ = (faq.question || "").toLowerCase();
      const words = faqQ.split(/\s+/).filter((w) => w.length > 3);
      if (faqQ && (q.includes(faqQ) || words.some((w) => q.includes(w)))) {
        return faq.answer;
      }
    }

    // 2. Greetings
    if (/^(hi|hello|hey|vanakkam|namaste|good morning|good afternoon|good evening|hola)\b/i.test(q)) {
      return `👋 Hello! Welcome to **${biz}**. I am ${bot}. How can I help you today? You can ask me about our products, pricing, or request a quick callback!`;
    }

    // 3. Price / Cost / Offers
    if (/price|pricing|cost|how much|rate|charge|discount|offer|coupon/i.test(q)) {
      let reply = `💰 For our latest pricing & exclusive offers at **${biz}**, please check our bio page buttons above!`;
      if (phone) {
        reply += `\n\nOr connect directly with us on WhatsApp: [Chat on WhatsApp](https://wa.me/${phone.replace(/\D/g, "")})`;
      }
      return reply;
    }

    // 4. Contact / WhatsApp / Phone / Call / Location
    if (/contact|phone|mobile|whatsapp|call|talk|speak|reach|number|location|address/i.test(q)) {
      let reply = `📞 You can reach **${biz}** directly:`;
      if (phone) reply += `\n• **WhatsApp / Phone:** [${phone}](https://wa.me/${phone.replace(/\D/g, "")})`;
      if (email) reply += `\n• **Email:** [${email}](mailto:${email})`;
      reply += `\n\nLeave your Name & Phone number here, and our team will get back to you shortly!`;
      return reply;
    }

    // 5. Products / Services / Catalog
    if (/product|service|what do you do|catalogue|catalog|buy|order|details|item/i.test(q)) {
      let reply = `✨ At **${biz}**, we offer:`;
      if (context.businessDescription) {
        reply += `\n\n${context.businessDescription}`;
      } else if (context.pageBio) {
        reply += `\n\n${context.pageBio}`;
      }
      if (context.productsList && context.productsList.length > 0) {
        reply += `\n\n**Featured Highlights:**\n` + context.productsList.map((p) => `• ${p}`).join("\n");
      }
      return reply;
    }

    // 6. Delivery / Shipping / Timings
    if (/delivery|shipping|time|timing|hours|open|closed|when/i.test(q)) {
      return `🚚 We process orders swiftly at **${biz}**! For custom delivery timelines or store hours, feel free to send us a quick WhatsApp message${phone ? ` at [${phone}](https://wa.me/${phone.replace(/\D/g, "")})` : ""}.`;
    }

    // 7. Thank you / Bye
    if (/thank|thanks|nandri|shukriya|bye|take care/i.test(q)) {
      return `🙏 You're very welcome! Feel free to reach out anytime. Have a wonderful day from the **${biz}** team! ⭐`;
    }

    // Default friendly response
    let defaultReply = `Thank you for your message! At **${biz}**, we're here to assist you with the best solutions.`;
    if (context.businessDescription) {
      defaultReply += `\n\n${context.businessDescription}`;
    }
    if (phone) {
      defaultReply += `\n\nWould you like to connect directly on WhatsApp? [Click here to Chat](https://wa.me/${phone.replace(/\D/g, "")})`;
    } else {
      defaultReply += `\n\nFeel free to share your Name & Contact number, and our team will be delighted to connect with you!`;
    }
    return defaultReply;
  }

  /**
   * POST /api/ai/bio-chat
   */
  router.post("/bio-chat", async (req: Request, res: Response) => {
    try {
      const {
        pageId,
        pageTitle = "Bio Link",
        pageSlug = "",
        pageBio = "",
        ownerUserId,
        businessContext = {},
        messages = [],
        visitorInfo
      } = req.body || {};

      const latestMessage = messages.length > 0 ? messages[messages.length - 1].content : "";
      if (!latestMessage) {
        return res.status(400).json({ error: "Message is required." });
      }

      // Check if visitor message contains phone / email to auto-capture lead
      let leadCaptured = false;
      let capturedLeadId = undefined;

      const phoneMatch = latestMessage.match(/(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4,6}/);
      const emailMatch = latestMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

      const detectedPhone = visitorInfo?.phone || (phoneMatch ? phoneMatch[0].trim() : "");
      const detectedEmail = visitorInfo?.email || (emailMatch ? emailMatch[0].trim() : "");
      const detectedName = visitorInfo?.name || "AI Chat Visitor";

      if ((detectedPhone && detectedPhone.length >= 7) || detectedEmail) {
        try {
          const root = getRootStore() as any;
          const ownerEmail = (ownerUserId as string) || root?.user?.email || "owner";
          const lead = buildLeadContact({
            fields: {
              "Full Name": detectedName,
              Phone: detectedPhone,
              Email: detectedEmail,
              Message: `Captured via Live AI Chat on ${pageTitle}: "${latestMessage}"`
            },
            source: "AI Chat Widget",
            pageId,
            pageTitle,
            pageSlug,
            ownerUserId: ownerEmail
          });
          lead.tags = ["AI Chat Lead", "Hot Lead"];
          if (root) {
            root.contacts = upsertOwnerContact(root.contacts || [], lead);
          }
          leadCaptured = true;
          capturedLeadId = lead.id;
        } catch (leadErr) {
          console.warn("[AI Chat] Lead capture error:", leadErr);
        }
      }

      // Build system prompt for Gemini
      const botName = businessContext.botName || "AI Sales Assistant";
      const bizName = businessContext.businessName || pageTitle;
      const bizDesc = businessContext.businessDescription || pageBio || "Creator / Business on KeyLink360";
      const faqs = businessContext.customFaqs || [];
      const contactPhone = businessContext.contactPhone || "";
      const contactEmail = businessContext.contactEmail || "";
      const blocksSummary = businessContext.blocksSummary || "";

      const systemPrompt = `You are "${botName}", a friendly, professional, high-converting AI Sales and Support Assistant for "${bizName}".
Your mission is to warmly welcome visitors, answer questions accurately, and encourage them to connect, explore products, or leave their contact details.

BUSINESS PROFILE:
- Business/Brand: ${bizName}
- About: ${bizDesc}
${contactPhone ? `- WhatsApp / Phone: ${contactPhone}` : ""}
${contactEmail ? `- Email: ${contactEmail}` : ""}
${blocksSummary ? `- Bio Page Features & Offerings: ${blocksSummary}` : ""}

${faqs.length > 0 ? `FREQUENTLY ASKED QUESTIONS (FAQS):\n${faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}` : ""}

GUIDELINES:
1. Always be helpful, warm, and concise (2-4 sentences max per reply).
2. If asked about contact or WhatsApp, provide: [WhatsApp Link](https://wa.me/${contactPhone.replace(/\D/g, "")}) if available.
3. If the user expresses buying interest, ask for their Name and Phone number so the team can follow up immediately.
4. Support English, Tamil, and Hindi naturally when the visitor speaks in those languages.
5. Format key words with clean Markdown (**bold**, lists).`;

      // Try Gemini API first
      let reply = await callGeminiApi(systemPrompt, latestMessage, messages);

      // If Gemini is not configured / unavailable, use smart fallback
      if (!reply) {
        reply = generateFallbackAiReply(latestMessage, {
          botName,
          businessName: bizName,
          businessDescription: bizDesc,
          customFaqs: faqs,
          contactPhone,
          contactEmail,
          pageTitle,
          pageBio
        });
      }

      return res.json({
        reply,
        leadCaptured,
        capturedLeadId
      });
    } catch (err: any) {
      console.error("[AI Chat] Handler error:", err);
      return res.status(500).json({ error: "Failed to generate AI reply." });
    }
  });

  /**
   * POST /api/ai/capture-lead (Explicit form in chat widget)
   */
  router.post("/capture-lead", (req: Request, res: Response) => {
    try {
      const {
        name,
        phone,
        email,
        pageId,
        pageTitle = "Bio Link",
        pageSlug = "",
        notes = "Captured from AI Chat Widget",
        ownerUserId
      } = req.body || {};

      if (!name && !phone && !email) {
        return res.status(400).json({ error: "Name, phone, or email is required." });
      }

      const root = getRootStore() as any;
      const ownerEmail = (ownerUserId as string) || root?.user?.email || "owner";
      const lead = buildLeadContact({
        fields: {
          "Full Name": name || "AI Chat Lead",
          Phone: phone || "",
          Email: email || "",
          Notes: notes
        },
        source: "AI Chat Widget",
        pageId,
        pageTitle,
        pageSlug,
        ownerUserId: ownerEmail
      });
      lead.tags = ["AI Chat Lead", "Direct Lead"];
      if (root) {
        root.contacts = upsertOwnerContact(root.contacts || [], lead);
      }

      return res.json({
        success: true,
        contact: lead
      });
    } catch (err: any) {
      console.error("[AI Chat] Capture lead error:", err);
      return res.status(500).json({ error: "Failed to capture lead." });
    }
  });

  return router;
}
