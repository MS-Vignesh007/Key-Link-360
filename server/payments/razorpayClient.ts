import crypto from "node:crypto";
import Razorpay from "razorpay";

export function getRazorpayKeyId(): string {
  return String(process.env.RAZORPAY_KEY_ID || "").trim();
}

export function getRazorpayKeySecret(): string {
  return String(process.env.RAZORPAY_KEY_SECRET || "").trim();
}

export function isRazorpayConfigured(): boolean {
  return Boolean(getRazorpayKeyId() && getRazorpayKeySecret());
}

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  if (!client) {
    client = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: getRazorpayKeySecret()
    });
  }
  return client;
}

export function verifyRazorpayCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = getRazorpayKeySecret();
  if (!secret) return false;
  const body = `${input.orderId}|${input.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(input.signature || ""));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function rupeesToPaise(amountInr: number): number {
  return Math.round(amountInr * 100);
}
