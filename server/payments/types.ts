export type PaymentRecordStatus = "created" | "paid" | "failed" | "cancelled";

export interface PaymentRecord {
  id: string;
  pageId: string;
  blockId?: string;
  blockLabel?: string;
  source: "BIO FORM" | "SMART FORM";
  amountInr: number;
  amountPaise: number;
  currency: "INR";
  description: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: PaymentRecordStatus;
  leadFields: Record<string, string>;
  contactId?: string;
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}
