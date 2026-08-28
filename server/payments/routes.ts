import { Router, type Request, type Response } from "express";
import { getRootStore, setRootStore, flushRootStore } from "../db/rootStore";
import { buildLeadContact, upsertOwnerContact } from "../leads";
import { getPageDocument } from "../pages/documents";
import {
  createPaymentRecord,
  findPaymentById,
  updatePaymentRecord
} from "./repository";
import {
  getRazorpayClient,
  getRazorpayKeyId,
  isRazorpayConfigured,
  rupeesToPaise,
  verifyRazorpayCheckoutSignature
} from "./razorpayClient";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function readPagePaymentConfig(details: Record<string, unknown>) {
  const enabledRaw = details.paymentEnabled;
  const enabled =
    enabledRaw === true ||
    enabledRaw === 1 ||
    enabledRaw === "1" ||
    String(enabledRaw || "").toLowerCase() === "true";
  const amountRaw = details.paymentAmountInr;
  const amountInr =
    typeof amountRaw === "number" && Number.isFinite(amountRaw)
      ? Math.round(amountRaw)
      : typeof amountRaw === "string" && amountRaw.trim()
        ? Math.round(Number(amountRaw))
        : 0;
  const description =
    typeof details.paymentDescription === "string" && details.paymentDescription.trim()
      ? details.paymentDescription.trim().slice(0, 200)
      : "Bio page form payment";
  return {
    enabled: Boolean(enabled && amountInr > 0),
    amountInr: amountInr > 0 ? amountInr : 0,
    description
  };
}

function resolveOwnerUserId(pageId: string) {
  const store = getRootStore();
  const pages = Array.isArray(store["pages_list"]) ? store["pages_list"] : [];
  const page = pages.find((item: any) => item?.id === pageId);
  const pageDoc = store[pageId] as Record<string, unknown> | undefined;
  return (
    (page && typeof page.ownerUserId === "string" && page.ownerUserId) ||
    (pageDoc && typeof pageDoc.ownerUserId === "string" && pageDoc.ownerUserId) ||
    "local"
  );
}

/** Contact / order is created ONLY after signature verification. */
async function finalizePaidOrder(input: {
  pageId: string;
  pageTitle?: string;
  pageSlug?: string;
  blockId?: string;
  blockLabel?: string;
  source: "BIO FORM" | "SMART FORM";
  fields: Record<string, string>;
  sourceDomain?: string;
  paymentId: string;
  amountInr: number;
}) {
  const store = getRootStore();
  const pages = Array.isArray(store["pages_list"]) ? store["pages_list"] : [];
  const page = pages.find((item: any) => item?.id === input.pageId);
  const pageDoc = store[input.pageId] as Record<string, unknown> | undefined;
  const pageDetails =
    pageDoc && pageDoc.details && typeof pageDoc.details === "object"
      ? (pageDoc.details as Record<string, unknown>)
      : {};
  const ownerUserId = resolveOwnerUserId(input.pageId);

  const existingContacts = Array.isArray(store["contacts"]) ? (store["contacts"] as any[]) : [];
  const emailHint = Object.values(input.fields).find((value) => String(value).includes("@"));
  const existing = emailHint
    ? existingContacts.find(
        (row) =>
          (!row.ownerUserId || row.ownerUserId === ownerUserId || row.ownerUserId === "local") &&
          String(row.email || "").toLowerCase() === String(emailHint).toLowerCase()
      )
    : null;

  const contact = buildLeadContact({
    fields: {
      ...input.fields,
      PaymentStatus: "paid",
      RazorpayPaymentId: input.paymentId,
      AmountInr: String(input.amountInr)
    },
    source: input.source,
    pageId: input.pageId,
    pageTitle: input.pageTitle || page?.title || "",
    blockId: input.blockId || "",
    blockLabel: input.blockLabel || "",
    ownerUserId,
    sourceDomain: input.sourceDomain || "",
    templateId: typeof pageDetails.templateId === "string" ? pageDetails.templateId : "",
    templateName: typeof pageDetails.templateName === "string" ? pageDetails.templateName : "",
    pageSlug: input.pageSlug || page?.slug || "",
    existing: existing || null
  });

  store["contacts"] = upsertOwnerContact(existingContacts, contact);

  if (!store["tracking_events"]) store["tracking_events"] = [];
  (store["tracking_events"] as any[]).unshift({
    id: "evt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    pageId: input.pageId,
    eventType: "purchase",
    eventLabel: `Razorpay: ₹${input.amountInr}`,
    details: {
      contactId: contact.id,
      razorpayPaymentId: input.paymentId,
      amountInr: input.amountInr
    },
    timestamp: new Date().toISOString()
  });
  setRootStore(store);
  void flushRootStore();
  return { contact, ownerUserId };
}

export function createPaymentsRouter() {
  const router = Router();

  router.get("/config", (_req: Request, res: Response) => {
    res.json({
      configured: isRazorpayConfigured(),
      keyId: getRazorpayKeyId() || null
    });
  });

  /** Starts Razorpay order only — does NOT create a paid order/contact. */
  router.post("/razorpay/create-order", async (req: Request, res: Response) => {
    try {
      if (!isRazorpayConfigured()) {
        res.status(503).json({ error: "Payments not configured." });
        return;
      }

      const pageId = String(req.body?.pageId || "").trim();
      const blockId = typeof req.body?.blockId === "string" ? req.body.blockId.trim() : "";
      const blockLabel =
        typeof req.body?.blockLabel === "string" ? req.body.blockLabel.trim() : "";
      const pageTitle = typeof req.body?.pageTitle === "string" ? req.body.pageTitle.trim() : "";
      const pageSlug = typeof req.body?.pageSlug === "string" ? req.body.pageSlug.trim() : "";
      const sourceDomain =
        typeof req.body?.sourceDomain === "string" ? req.body.sourceDomain.trim() : "";
      const sourceRaw = String(req.body?.source || "BIO FORM").toUpperCase();
      const source: "BIO FORM" | "SMART FORM" =
        sourceRaw.includes("SMART") ? "SMART FORM" : "BIO FORM";
      const fields =
        req.body?.fields && typeof req.body.fields === "object" && !Array.isArray(req.body.fields)
          ? Object.fromEntries(
              Object.entries(req.body.fields as Record<string, unknown>).map(([k, v]) => [
                String(k),
                v == null ? "" : String(v)
              ])
            )
          : {};

      if (!pageId) {
        res.status(400).json({ error: "pageId is required." });
        return;
      }
      if (Object.keys(fields).length === 0) {
        res.status(400).json({ error: "fields are required." });
        return;
      }

      const doc = await getPageDocument(pageId);
      if (!doc) {
        res.status(404).json({ error: "Page not found." });
        return;
      }

      const paymentConfig = readPagePaymentConfig(doc.details || {});
      if (!paymentConfig.enabled || paymentConfig.amountInr <= 0) {
        res.status(400).json({ error: "Payment is not enabled for this page." });
        return;
      }

      const amountPaise = rupeesToPaise(paymentConfig.amountInr);
      if (amountPaise < 100) {
        res.status(400).json({ error: "Minimum payment amount is ₹1." });
        return;
      }

      const ownerUserId = resolveOwnerUserId(pageId);
      const razorpay = getRazorpayClient();
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `key_${Date.now()}`.slice(0, 40),
        notes: {
          pageId,
          blockId,
          paymentPage: "bio"
        }
      });

      const record = createPaymentRecord({
        pageId,
        blockId,
        blockLabel,
        source,
        amountInr: paymentConfig.amountInr,
        amountPaise,
        currency: "INR",
        description: paymentConfig.description,
        razorpayOrderId: String(order.id),
        status: "created",
        leadFields: {
          ...fields,
          __pageTitle: pageTitle,
          __pageSlug: pageSlug,
          __sourceDomain: sourceDomain
        },
        ownerUserId
      });

      res.json({
        success: true,
        keyId: getRazorpayKeyId(),
        orderId: order.id,
        amount: amountPaise,
        currency: "INR",
        amountInr: paymentConfig.amountInr,
        description: paymentConfig.description,
        paymentRecordId: record.id
      });
    } catch (error) {
      console.error("Razorpay create-order failed:", error);
      res.status(500).json({ error: errorMessage(error) || "Could not create payment order." });
    }
  });

  /** Confirms payment + creates order/contact ONLY after HMAC verification. */
  router.post("/razorpay/verify", async (req: Request, res: Response) => {
    try {
      if (!isRazorpayConfigured()) {
        res.status(503).json({ error: "Payments not configured." });
        return;
      }

      const paymentRecordId = String(req.body?.paymentRecordId || "").trim();
      const orderId = String(req.body?.razorpay_order_id || "").trim();
      const paymentId = String(req.body?.razorpay_payment_id || "").trim();
      const signature = String(req.body?.razorpay_signature || "").trim();

      if (!paymentRecordId || !orderId || !paymentId || !signature) {
        res.status(400).json({ error: "Missing payment verification fields." });
        return;
      }

      const record = findPaymentById(paymentRecordId);
      if (!record) {
        res.status(404).json({ error: "Payment record not found." });
        return;
      }
      if (record.razorpayOrderId !== orderId) {
        res.status(400).json({ error: "Order mismatch." });
        return;
      }

      if (record.status === "paid") {
        res.json({
          success: true,
          alreadyPaid: true,
          confirmed: true,
          paymentRecordId: record.id,
          amountInr: record.amountInr,
          contactId: record.contactId || null
        });
        return;
      }

      const ok = verifyRazorpayCheckoutSignature({ orderId, paymentId, signature });
      if (!ok) {
        updatePaymentRecord(record.id, { status: "failed" });
        res.status(400).json({ error: "Invalid payment signature.", confirmed: false });
        return;
      }

      const meta = record.leadFields || {};
      const pageTitle = String(meta.__pageTitle || "");
      const pageSlug = String(meta.__pageSlug || "");
      const sourceDomain = String(meta.__sourceDomain || "");
      const leadFields = Object.fromEntries(
        Object.entries(meta).filter(([key]) => !key.startsWith("__"))
      );

      const { contact } = await finalizePaidOrder({
        pageId: record.pageId,
        pageTitle,
        pageSlug,
        blockId: record.blockId,
        blockLabel: record.blockLabel,
        source: record.source,
        fields: leadFields,
        sourceDomain,
        paymentId,
        amountInr: record.amountInr
      });

      const updated = updatePaymentRecord(record.id, {
        status: "paid",
        razorpayPaymentId: paymentId,
        paidAt: new Date().toISOString(),
        contactId: contact.id
      });

      res.json({
        success: true,
        confirmed: true,
        paymentRecordId: updated?.id || record.id,
        amountInr: record.amountInr,
        contactId: contact.id
      });
    } catch (error) {
      console.error("Razorpay verify failed:", error);
      res.status(500).json({ error: errorMessage(error) || "Payment verification failed.", confirmed: false });
    }
  });

  /** Client reports modal dismiss — never marks paid. */
  router.post("/razorpay/cancel", (req: Request, res: Response) => {
    try {
      const paymentRecordId = String(req.body?.paymentRecordId || "").trim();
      if (!paymentRecordId) {
        res.status(400).json({ error: "paymentRecordId is required." });
        return;
      }
      const record = findPaymentById(paymentRecordId);
      if (!record) {
        res.status(404).json({ error: "Payment record not found." });
        return;
      }
      if (record.status === "paid") {
        res.status(409).json({ error: "Payment already confirmed." });
        return;
      }
      updatePaymentRecord(record.id, { status: "cancelled" });
      res.json({ success: true, status: "cancelled" });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  });

  return router;
}
