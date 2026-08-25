import { apiUrl } from "./apiBase";
import type { FormPaymentUiState } from "../components/bio/FormPaymentCheckout";

export type RazorpayCheckoutSuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (response: RazorpayCheckoutSuccess) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
};

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => { open: () => void };

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay requires a browser."));
  }
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-key-razorpay="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay.")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.keyRazorpay = "1";
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Razorpay Checkout."));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export type CreateOrderResponse = {
  success: boolean;
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  amountInr: number;
  description: string;
  paymentRecordId: string;
  error?: string;
};

export type VerifyPaymentResponse = {
  success?: boolean;
  confirmed?: boolean;
  amountInr?: number;
  contactId?: string | null;
  paymentRecordId?: string;
  error?: string;
};

export async function createRazorpayOrder(body: Record<string, unknown>): Promise<CreateOrderResponse> {
  const response = await fetch(apiUrl("/api/payments/razorpay/create-order"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = (await response.json().catch(() => null)) as CreateOrderResponse | null;
  if (!response.ok || !payload?.orderId || !payload.paymentRecordId) {
    throw new Error(payload?.error || "Could not start payment.");
  }
  return payload;
}

export async function verifyRazorpayPayment(input: {
  paymentRecordId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<VerifyPaymentResponse> {
  const response = await fetch(apiUrl("/api/payments/razorpay/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = (await response.json().catch(() => null)) as VerifyPaymentResponse | null;
  if (!response.ok || !payload?.success || payload.confirmed !== true) {
    throw new Error(payload?.error || "Payment verification failed.");
  }
  return payload;
}

async function cancelRazorpayPayment(paymentRecordId: string) {
  try {
    await fetch(apiUrl("/api/payments/razorpay/cancel"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentRecordId })
    });
  } catch {
    // Best-effort; UI already shows cancelled.
  }
}

function pickPrefill(fields: Record<string, string>) {
  const entries = Object.entries(fields);
  const email =
    entries.find(([k, v]) => k.toLowerCase().includes("email") || String(v).includes("@"))?.[1] ||
    undefined;
  const name =
    entries.find(([k]) => {
      const key = k.toLowerCase();
      return key.includes("name") && !key.includes("user");
    })?.[1] || undefined;
  const contact =
    entries.find(([k]) => {
      const key = k.toLowerCase();
      return key.includes("phone") || key.includes("mobile") || key.includes("whatsapp");
    })?.[1] || undefined;
  return { name, email, contact };
}

export type SecureCheckoutResult = {
  state: Extract<FormPaymentUiState, "success" | "failed" | "cancelled">;
  amountInr?: number;
  errorMessage?: string;
  contactId?: string | null;
};

/**
 * Opens Razorpay Checkout in-place. Success only after backend signature verify.
 * Does not navigate or write success into the URL.
 */
export async function openRazorpayCheckoutAndVerify(input: {
  pageId: string;
  pageTitle?: string;
  pageSlug?: string;
  blockId: string;
  blockLabel?: string;
  source: "BIO FORM" | "SMART FORM";
  fields: Record<string, string>;
  sourceDomain?: string;
  displayName?: string;
  onStateChange?: (state: FormPaymentUiState) => void;
}): Promise<SecureCheckoutResult> {
  input.onStateChange?.("processing");

  let paymentRecordId = "";
  try {
    const order = await createRazorpayOrder({
      pageId: input.pageId,
      pageTitle: input.pageTitle,
      pageSlug: input.pageSlug,
      blockId: input.blockId,
      blockLabel: input.blockLabel,
      source: input.source,
      fields: input.fields,
      sourceDomain: input.sourceDomain
    });
    paymentRecordId = order.paymentRecordId;

    await loadRazorpayCheckoutScript();
    if (!window.Razorpay) {
      throw new Error("Razorpay Checkout failed to load.");
    }

    const verifyResult = await new Promise<VerifyPaymentResponse>((resolve, reject) => {
      let settled = false;
      const rzp = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: input.displayName || "KEYLINK360",
        description: order.description,
        order_id: order.orderId,
        prefill: pickPrefill(input.fields),
        theme: { color: "#ec4899" },
        handler: (response) => {
          input.onStateChange?.("processing");
          void verifyRazorpayPayment({
            paymentRecordId: order.paymentRecordId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
            .then((verified) => {
              settled = true;
              resolve(verified);
            })
            .catch((error) => {
              settled = true;
              reject(error instanceof Error ? error : new Error(String(error)));
            });
        },
        modal: {
          ondismiss: () => {
            if (settled) return;
            settled = true;
            void cancelRazorpayPayment(order.paymentRecordId);
            reject(new Error("Payment cancelled."));
          }
        }
      });
      rzp.open();
    });

    if (verifyResult.confirmed !== true) {
      input.onStateChange?.("failed");
      return { state: "failed", errorMessage: "Payment was not confirmed by the server." };
    }

    input.onStateChange?.("success");
    return {
      state: "success",
      amountInr: verifyResult.amountInr ?? order.amountInr,
      contactId: verifyResult.contactId
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed.";
    if (/cancel/i.test(message)) {
      if (paymentRecordId) void cancelRazorpayPayment(paymentRecordId);
      input.onStateChange?.("cancelled");
      return { state: "cancelled" };
    }
    input.onStateChange?.("failed");
    return {
      state: "failed",
      errorMessage: message.includes("configured") ? "Payments not configured." : message
    };
  }
}

export function pageRequiresPayment(details?: {
  paymentEnabled?: boolean | string | number;
  paymentAmountInr?: number | string;
} | null): boolean {
  if (!details) return false;
  const enabledRaw = details.paymentEnabled;
  const enabled =
    enabledRaw === true ||
    enabledRaw === 1 ||
    enabledRaw === "1" ||
    String(enabledRaw || "").toLowerCase() === "true";
  const amount = Number(details.paymentAmountInr);
  return enabled && Number.isFinite(amount) && amount > 0;
}
