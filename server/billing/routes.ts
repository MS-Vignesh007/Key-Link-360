import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { requireAuth, type AuthedRequest } from "../auth/routes";
import { getRootStore, setRootStore, flushRootStore } from "../db/rootStore";
import {
  PLAN_DEFINITIONS,
  getPlanDefinition,
  normalizePlanId,
  type PlanId
} from "./plans";
import {
  getUserSubscription,
  getUserSubscriptionSummary,
  upsertUserSubscription,
  recordBillingPayment,
  type BillingInterval,
  type SubscriptionRecord,
  type BillingHistoryRecord
} from "./repository";
import {
  getRazorpayClient,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  isRazorpayConfigured,
  rupeesToPaise,
  verifyRazorpayCheckoutSignature
} from "../payments/razorpayClient";

export function createBillingRouter() {
  const router = Router();

  /** Public: List Available Plans and Feature Quotas */
  router.get("/plans", (_req: Request, res: Response) => {
    res.json({
      plans: Object.values(PLAN_DEFINITIONS),
      currency: "INR",
      paymentGatewayConfigured: isRazorpayConfigured(),
      razorpayKeyId: getRazorpayKeyId() || null
    });
  });

  /** Authed: Current User's Subscription, Quotas, Usage, and Invoices */
  router.get("/subscription", requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const summary = getUserSubscriptionSummary(req.authUser!.id);
      res.json({
        ...summary,
        gatewayConfigured: isRazorpayConfigured(),
        razorpayKeyId: getRazorpayKeyId() || null
      });
    } catch (error) {
      console.error("Fetch subscription error:", error);
      res.status(500).json({ error: "Failed to load subscription details." });
    }
  });

  /** Authed: Create Razorpay Checkout Order for Plan Upgrade */
  router.post("/checkout", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      if (!isRazorpayConfigured()) {
        res.status(503).json({
          error: "Payment gateway is not configured on this server.",
          code: "PAYMENTS_NOT_CONFIGURED"
        });
        return;
      }

      const planInput = String(req.body?.planId || "PRO");
      const planId = normalizePlanId(planInput);
      if (planId === "FREE") {
        res.status(400).json({ error: "Cannot create payment for the Free Plan." });
        return;
      }

      const interval: BillingInterval =
        String(req.body?.interval || "monthly").toLowerCase() === "yearly" ? "yearly" : "monthly";

      const planDef = getPlanDefinition(planId);
      const amountInr = interval === "yearly" ? planDef.priceYearlyInr : planDef.priceMonthlyInr;

      let orderId = `order_sim_${Date.now().toString(36)}`;
      let currency = "INR";
      let amountPaise = rupeesToPaise(amountInr);

      try {
        const client = getRazorpayClient();
        const order = await client.orders.create({
          amount: amountPaise,
          currency: "INR",
          receipt: `sub_${req.authUser!.id.slice(-8)}_${Date.now().toString(36)}`,
          notes: {
            userId: req.authUser!.id,
            userEmail: req.authUser!.email,
            planId,
            interval
          }
        });
        orderId = order.id;
        currency = order.currency;
        amountPaise = order.amount;
      } catch (gatewayError) {
        console.warn("[billing] Razorpay gateway create order fallback (test simulation mode):", gatewayError);
      }

      res.json({
        orderId,
        amount: amountPaise,
        amountInr,
        currency,
        keyId: getRazorpayKeyId(),
        planId,
        planName: planDef.name,
        interval
      });
    } catch (error) {
      console.error("Create subscription checkout error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to initialize payment order."
      });
    }
  });

  /** Authed: Cryptographically Verify Payment and Activate Subscription */
  router.post("/verify", requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const orderId = String(req.body?.orderId || "").trim();
      const paymentId = String(req.body?.paymentId || "").trim();
      const signature = String(req.body?.signature || "").trim();
      const planInput = String(req.body?.planId || "PRO");
      const planId = normalizePlanId(planInput);
      const interval: BillingInterval =
        String(req.body?.interval || "monthly").toLowerCase() === "yearly" ? "yearly" : "monthly";

      if (!orderId || !paymentId || !signature) {
        res.status(400).json({ error: "Missing required payment verification parameters." });
        return;
      }

      const valid = verifyRazorpayCheckoutSignature({
        orderId,
        paymentId,
        signature
      });

      if (!valid) {
        console.warn(`[billing] Invalid payment signature for order ${orderId} by user ${req.authUser!.id}`);
        res.status(400).json({
          error: "Cryptographic signature verification failed. Plan was not upgraded.",
          code: "INVALID_SIGNATURE"
        });
        return;
      }

      const planDef = getPlanDefinition(planId);
      const amountInr = interval === "yearly" ? planDef.priceYearlyInr : planDef.priceMonthlyInr;
      const now = new Date().toISOString();
      const periodDurationMs =
        interval === "yearly" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      const currentPeriodEnd = new Date(Date.now() + periodDurationMs).toISOString();

      const subRecord: SubscriptionRecord = {
        userId: req.authUser!.id,
        planId,
        planName: planDef.name,
        status: "ACTIVE",
        billingInterval: interval,
        amountInr,
        provider: "razorpay",
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        startDate: now,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now
      };

      const updatedSub = upsertUserSubscription(subRecord);

      // Record in billing history
      const historyEntry: BillingHistoryRecord = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: req.authUser!.id,
        planId,
        planName: planDef.name,
        billingInterval: interval,
        amountInr,
        currency: "INR",
        status: "paid",
        providerPaymentId: paymentId,
        providerOrderId: orderId,
        createdAt: now
      };
      recordBillingPayment(historyEntry);

      // Record telemetry purchase event
      const store = getRootStore();
      if (!store["tracking_events"]) store["tracking_events"] = [];
      (store["tracking_events"] as any[]).unshift({
        id: `evt_sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        pageId: "platform_subscription",
        eventType: "purchase",
        eventLabel: `Subscription Upgrade: ${planDef.name} (${interval}) - ₹${amountInr}`,
        details: {
          userId: req.authUser!.id,
          planId,
          interval,
          amountInr,
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId
        },
        timestamp: now
      });
      setRootStore(store);
      void flushRootStore();

      const summary = getUserSubscriptionSummary(req.authUser!.id);
      res.json({
        success: true,
        message: `Congratulations! Your account has been upgraded to ${planDef.name}.`,
        summary
      });
    } catch (error) {
      console.error("Subscription verification error:", error);
      res.status(500).json({ error: "Failed to verify and activate subscription." });
    }
  });

  /** Authed: Cancel Auto-Renewal at Period End */
  router.post("/cancel", requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const current = getUserSubscription(req.authUser!.id);
      if (current.planId === "FREE") {
        res.status(400).json({ error: "Free Plan has no active recurring subscription to cancel." });
        return;
      }

      current.cancelAtPeriodEnd = true;
      current.updatedAt = new Date().toISOString();
      const updated = upsertUserSubscription(current);

      res.json({
        success: true,
        message: "Your subscription will not renew after the current billing period expires.",
        subscription: updated
      });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Failed to cancel subscription." });
    }
  });

  /** Public / Webhook: Razorpay Webhook Handler */
  router.post("/webhook", (req: Request, res: Response) => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || getRazorpayKeySecret();
      const signature = String(req.headers["x-razorpay-signature"] || "");

      if (!secret || !signature) {
        res.status(400).json({ error: "Missing webhook signature or secret." });
        return;
      }

      const body = JSON.stringify(req.body);
      const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
      const a = Buffer.from(expected);
      const b = Buffer.from(signature);

      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        res.status(400).json({ error: "Invalid webhook signature." });
        return;
      }

      const event = req.body?.event;
      const payload = req.body?.payload;

      // Handle subscription/payment events idempotently
      if (event === "payment.captured" || event === "order.paid") {
        const payment = payload?.payment?.entity;
        const notes = payment?.notes || {};
        const userId = notes.userId;
        const planId = normalizePlanId(notes.planId || "PRO");
        const interval: BillingInterval = notes.interval === "yearly" ? "yearly" : "monthly";

        if (userId) {
          const planDef = getPlanDefinition(planId);
          const amountInr = Number(payment?.amount || 0) / 100;
          const now = new Date().toISOString();
          const periodDurationMs =
            interval === "yearly" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
          const currentPeriodEnd = new Date(Date.now() + periodDurationMs).toISOString();

          upsertUserSubscription({
            userId,
            planId,
            planName: planDef.name,
            status: "ACTIVE",
            billingInterval: interval,
            amountInr,
            provider: "razorpay",
            razorpayPaymentId: payment?.id,
            razorpayOrderId: payment?.order_id,
            startDate: now,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
            createdAt: now,
            updatedAt: now
          });

          recordBillingPayment({
            id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId,
            planId,
            planName: planDef.name,
            billingInterval: interval,
            amountInr,
            currency: "INR",
            status: "paid",
            providerPaymentId: String(payment?.id || ""),
            providerOrderId: String(payment?.order_id || ""),
            createdAt: now
          });
        }
      } else if (event === "payment.failed") {
        const payment = payload?.payment?.entity;
        const notes = payment?.notes || {};
        const userId = notes.userId;
        if (userId) {
          const current = getUserSubscription(userId);
          if (current.planId !== "FREE") {
            current.status = "PAST_DUE";
            upsertUserSubscription(current);
          }
        }
      }

      res.json({ status: "ok" });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: "Webhook handling failed." });
    }
  });

  return router;
}
