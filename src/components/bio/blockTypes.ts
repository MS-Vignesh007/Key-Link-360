import type { BlockRecord, FormSubmitPayload } from "../../lib/bioBlocks";
import type { FormPaymentUiState } from "./FormPaymentCheckout";

export type BlockRenderMode = "preview" | "live";

export interface BlockRendererContext {
  compact?: boolean;
  displayTitle?: string;
  displayHandle?: string;
  socialLinks?: import("../../lib/bioBlocks").SocialLinkItem[];
  /** Page-level Razorpay — Form/Smart Form CTA reads this for live UI updates. */
  paymentEnabled?: boolean;
  paymentAmountInr?: number;
}

export type SecureCheckoutRequest = {
  blockId: string;
  fields: FormSubmitPayload;
  source: "BIO FORM" | "SMART FORM";
  destinationEmail?: string;
};

export interface BlockRendererHandlers {
  onToast?: (message: string) => void;
  onExternalLink?: (url: string, label?: string) => void;
  onWhatsApp?: (value: string) => void;
  onCopy?: (text: string, label?: string) => void;
  onSpinOpen?: (blockId: string) => void;
  onLeadSubmit?: (blockId: string, email: string, destinationEmail?: string) => void;
  onFormSubmit?: (blockId: string, data: FormSubmitPayload, destinationEmail?: string) => void;
  onVCardDownload?: (block: BlockRecord) => void;
  onTrack?: (action: string, label: string, meta?: Record<string, unknown>) => void;
  leadEmails?: Record<string, string>;
  onLeadEmailChange?: (blockId: string, email: string) => void;
  /** Non-payment Form thank-you overlay (same page, no route). */
  onShowThanks?: () => void;
  /**
   * When true, Form/Smart Form must not open thank-you overlay;
   * use in-place checkout states via onSecureCheckout instead.
   */
  deferThanksUntilPaid?: boolean;
  paymentAmountInr?: number;
  paymentSuccessTitle?: string;
  paymentSuccessMessage?: string;
  /** Live payment: parent runs Razorpay + server verify. */
  onSecureCheckout?: (request: SecureCheckoutRequest) => Promise<{
    state: FormPaymentUiState;
    amountInr?: number;
    errorMessage?: string;
  }>;
}

export interface BlockRendererProps {
  block: BlockRecord;
  mode: BlockRenderMode;
  context?: BlockRendererContext;
  handlers?: BlockRendererHandlers;
}
