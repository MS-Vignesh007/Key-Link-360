import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Copy, MessageSquare, MapPin, User, Phone, Mail, Megaphone } from "lucide-react";
import {
  BlockRecord,
  DEFAULT_SHOP_PRODUCTS,
  destinationEmailFromBlock,
  downloadVCard,
  getCurrencySymbol,
  getFaqItems,
  getFormFields,
  getFormSelectOptions,
  getFormSubmitLabel,
  getGalleryItems,
  getPricingPlanFeatures,
  getPricingPlans,
  getStatItems,
  getBannerStyle,
  getCallPhone,
  getEmailAddress,
  buildTelUrl,
  buildMailtoUrl,
  getTestimonials,
  getTipOptions,
  getVideoThumbnail,
  normalizeExternalUrl,
  resolveGoogleMap,
  type FormSubmitPayload
} from "../../lib/bioBlocks";
import { getLinkArrowColor, getLinkButtonStyle, isDefaultBrightLink } from "../../lib/bioLinkColors";
import type { BlockRendererContext, BlockRendererHandlers, BlockRenderMode } from "./blockTypes";
import CountdownBlockView from "./CountdownBlockView";
import SocialLinksRow from "./SocialLinksRow";
import FormPaymentCheckout, { type FormPaymentUiState } from "./FormPaymentCheckout";
import {
  SplitHeroBlockView,
  VideoHeroBlockView,
  GlowBadgeBlockView,
  FeatureHeroBlockView
} from "./developerBlocks/HeroBlocks";
import {
  TogglePricingBlockView,
  ProductShowcaseBlockView,
  ComparisonTableBlockView,
  PaymentButtonBlockView
} from "./developerBlocks/CommerceBlocks";
import {
  BrandLogosBlockView,
  StarRatingsBlockView,
  PressMentionsBlockView
} from "./developerBlocks/SocialProofBlocks";
import {
  BeforeAfterSliderBlockView,
  PortfolioGalleryBlockView,
  VideoShowcaseBlockView,
  AudioPlayerBlockView
} from "./developerBlocks/InteractiveMediaBlocks";
import {
  MultiStepFormBlockView,
  LeadMagnetBlockView,
  MeetingBookerBlockView,
  NewsletterBlockView
} from "./developerBlocks/ConversionBlocks";
import {
  NavbarBlockView,
  FooterBlockView,
  MainFeatureBlockView,
  AutoSliderBlockView,
  GoogleFormBlockView,
  FlashOfferBlockView,
  CommunityHubBlockView,
  YouTubeChannelBlockView,
  InstagramFeedBlockView
} from "./developerBlocks/PersonaBlocks";
import InlineEditableText from "./InlineEditableText";
import {
  CanvaInlineText,
  CanvaInlineImage,
  CanvaInlineIcon,
  CanvaInlineItemControls,
  CanvaInlineAddButton
} from "./CanvaDirectEditSuite";

function resolvePagePayment(
  handlers: BlockRendererHandlers,
  context: BlockRendererContext
): { enabled: boolean; amountInr?: number } {
  const amountFromHandlers =
    typeof handlers.paymentAmountInr === "number" && handlers.paymentAmountInr > 0
      ? handlers.paymentAmountInr
      : undefined;
  const amountFromContext =
    typeof context.paymentAmountInr === "number" && context.paymentAmountInr > 0
      ? context.paymentAmountInr
      : undefined;
  const amountInr = amountFromHandlers ?? amountFromContext;
  const enabled =
    handlers.deferThanksUntilPaid === true ||
    (context.paymentEnabled === true && Boolean(amountInr));
  return { enabled, amountInr };
}

function PaymentRequiredBadge({ amountInr, compact }: { amountInr?: number; compact?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-pink-200 bg-pink-50 text-pink-800 font-bold text-center ${
        compact ? "text-[9px] px-2 py-1" : "text-[10px] px-2.5 py-1.5"
      }`}
    >
      {amountInr ? `Razorpay · Pay ₹${amountInr} on submit` : "Razorpay payment required on submit"}
    </div>
  );
}

interface BlockViewProps {
  block: BlockRecord;
  mode: BlockRenderMode;
  context: BlockRendererContext;
  handlers: BlockRendererHandlers;
}

function track(handlers: BlockRendererHandlers, action: string, label: string, meta?: Record<string, unknown>) {
  handlers.onTrack?.(action, label, meta);
}

function openLink(handlers: BlockRendererHandlers, mode: BlockRenderMode, url: string, label?: string) {
  if (mode === "preview") {
    handlers.onToast?.(`🔗 Simulated redirection to: ${url || "https://key.link"}`);
    return;
  }
  handlers.onExternalLink?.(url, label);
}

function openWhatsApp(handlers: BlockRendererHandlers, mode: BlockRenderMode, value: string, label?: string) {
  if (mode === "preview") {
    handlers.onWhatsApp?.(value);
    return;
  }
  if (!value.trim()) {
    handlers.onToast?.("WhatsApp number is not configured yet.");
    return;
  }
  handlers.onWhatsApp?.(value);
  track(handlers, "click", label || "WhatsApp");
}

export function HeaderBlockView({ block, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  return (
    <h2
      className={`key-phone-preview__block-heading font-display text-center leading-snug ${
        compact ? "text-sm pt-0" : "pt-2"
      }`}
    >
      <InlineEditableText
        value={block.label}
        onChange={(newText) => handlers.onInlineTextChange?.(block.id, "label", newText)}
        isEditingAllowed={handlers.isInlineEditingAllowed}
        tagName="span"
      />
    </h2>
  );
}

export function TextBlockView({ block, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  return (
    <div
      className={`key-phone-preview__block-text text-center leading-relaxed ${
        compact ? "p-2.5 rounded-xl text-xs" : "p-3.5 rounded-2xl"
      }`}
    >
      <InlineEditableText
        value={block.label}
        onChange={(newText) => handlers.onInlineTextChange?.(block.id, "label", newText)}
        isEditingAllowed={handlers.isInlineEditingAllowed}
        multiline
        tagName="p"
      />
    </div>
  );
}

export function LinkButtonBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (mode === "preview" && handlers.isInlineEditingAllowed) {
          handlers.onSelectElement?.(block.id, "value");
        } else {
          track(handlers, "click", `Button: ${block.label}`);
          const openThanks =
            block.openThanksPage === true ||
            block.openThanksPage === "Yes" ||
            block.openThanksPage === "true";
          if (openThanks && handlers.onShowThanks) {
            handlers.onShowThanks();
            return;
          }
          openLink(handlers, mode, block.value || "", block.label);
        }
      }}
      style={getLinkButtonStyle(block as Parameters<typeof getLinkButtonStyle>[0])}
      className={`w-full font-bold flex items-center justify-between transition-all active:scale-98 cursor-pointer key-bio-link-btn ${
        compact ? "py-3 px-4 rounded-xl text-xs" : "py-3.5 px-4 rounded-2xl text-sm"
      } ${
        isDefaultBrightLink(block as Parameters<typeof isDefaultBrightLink>[0])
          ? "shadow-md shadow-violet-500/30 border-0"
          : "shadow-sm border border-slate-200/85"
      }`}
    >
      <div className={`flex items-center truncate text-left min-w-0 flex-1 ${compact ? "gap-1.5" : "gap-2"}`}>
        {block.iconEmoji ? (
          <CanvaInlineIcon
            value={String(block.iconEmoji)}
            onChange={(newIcon) => handlers.onInlineTextChange?.(block.id, "iconEmoji", newIcon)}
            isEditingAllowed={handlers.isInlineEditingAllowed}
            className={compact ? "text-sm" : "text-base"}
          />
        ) : handlers.isInlineEditingAllowed ? (
          <CanvaInlineIcon
            value="✨"
            onChange={(newIcon) => handlers.onInlineTextChange?.(block.id, "iconEmoji", newIcon)}
            isEditingAllowed={handlers.isInlineEditingAllowed}
            className="opacity-40 hover:opacity-100 text-xs mr-0.5"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <InlineEditableText
            value={block.label}
            onChange={(newText) => handlers.onInlineTextChange?.(block.id, "label", newText)}
            isEditingAllowed={handlers.isInlineEditingAllowed}
            className="key-bio-link-label block font-bold leading-tight"
          />
          {block.subtext && (
            <InlineEditableText
              value={String(block.subtext)}
              onChange={(newText) => handlers.onInlineTextChange?.(block.id, "subtext", newText)}
              isEditingAllowed={handlers.isInlineEditingAllowed}
              className="key-bio-link-subtext block font-medium opacity-70 mt-0.5"
            />
          )}
        </div>
      </div>
      {block.showArrow !== "No" && (
        <ArrowRight
          className={`shrink-0 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`}
          style={{ color: getLinkArrowColor(block as Parameters<typeof getLinkArrowColor>[0]) }}
        />
      )}
    </div>
  );
}

export function SocialsBlockView({ block, mode, context, handlers }: BlockViewProps) {
  return (
    <SocialLinksRow
      block={block}
      compact={context.compact}
      isInlineEditingAllowed={handlers.isInlineEditingAllowed}
      onUpdateSocials={(newLinks) => {
        handlers.onInlineTextChange?.(block.id, "socialLinks", newLinks);
      }}
      onLinkClick={(link) => {
        if (mode === "preview") {
          handlers.onToast?.(`🔗 Opening ${link.label}: ${link.url}`);
          return;
        }
        track(handlers, "click", `Social Icon: ${link.label}`);
        if (link.id === "whatsapp") {
          handlers.onWhatsApp?.(link.url);
        } else {
          handlers.onExternalLink?.(link.url, link.label);
        }
      }}
    />
  );
}

export function ShopBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const shopProducts =
    Array.isArray(block.products) && block.products.length ? block.products : DEFAULT_SHOP_PRODUCTS;
  const align = (block.alignment as string) || "Centre";
  const alignClass = align === "Left" ? "text-left" : align === "Right" ? "text-right" : "text-center";
  const symbol = getCurrencySymbol(block.currency as string);
  const cardBg = (block.bgColor as string) || "#10B981";
  const textCol = (block.textColor as string) || "#FFFFFF";

  const onProductClick = (name: string, url?: string) => {
    if (mode === "preview") {
      handlers.onToast?.(`🛒 Simulated product click: ${name}`);
      return;
    }
    track(handlers, "click", `Shop Product: ${name}`);
    if (url) handlers.onExternalLink?.(url, name);
  };

  const handleUpdateProduct = (index: number, field: string, val: any) => {
    const updated = [...shopProducts];
    updated[index] = { ...updated[index], [field]: val };
    handlers.onInlineTextChange?.(block.id, "products", updated);
  };

  const handleMoveProduct = (index: number, direction: "left" | "right") => {
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= shopProducts.length) return;
    const copy = [...shopProducts];
    const item = copy.splice(index, 1)[0];
    copy.splice(target, 0, item);
    handlers.onInlineTextChange?.(block.id, "products", copy);
  };

  const handleDeleteProduct = (index: number) => {
    const copy = shopProducts.filter((_, idx) => idx !== index);
    handlers.onInlineTextChange?.(block.id, "products", copy);
  };

  const handleAddProduct = () => {
    const newProd = {
      id: `prod_${Date.now()}`,
      name: "New Product",
      price: "499",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600",
      url: "https://keylink360.today"
    };
    handlers.onInlineTextChange?.(block.id, "products", [...shopProducts, newProd]);
  };

  return (
    <div className={`text-left w-full ${compact ? "space-y-2" : "space-y-3 pt-2"}`}>
      <InlineEditableText
        value={block.label}
        onChange={(newLabel) => handlers.onInlineTextChange?.(block.id, "label", newLabel)}
        isEditingAllowed={handlers.isInlineEditingAllowed}
        className={`font-bold text-slate-500 block tracking-wider uppercase ${
          compact ? "text-[9px]" : "text-xs"
        } ${alignClass}`}
      />
      {compact ? (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {shopProducts.map((product: BlockRecord, index: number) => (
            <div
              key={product.id || index}
              className="min-w-[105px] bg-white rounded-xl border border-slate-200 overflow-hidden shrink-0 shadow-sm hover:shadow transition-all relative group/shopprod"
            >
              {handlers.isInlineEditingAllowed && (
                <CanvaInlineItemControls
                  onMoveUp={index > 0 ? () => handleMoveProduct(index, "left") : undefined}
                  onMoveDown={index < shopProducts.length - 1 ? () => handleMoveProduct(index, "right") : undefined}
                  onDelete={() => handleDeleteProduct(index)}
                  isFirst={index === 0}
                  isLast={index === shopProducts.length - 1}
                />
              )}
              <div className="h-16 bg-white flex items-center justify-center p-1.5">
                {handlers.isInlineEditingAllowed ? (
                  <CanvaInlineImage
                    src={String(product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600")}
                    alt={String(product.name || "Product")}
                    onChange={(newImg) => handleUpdateProduct(index, "image", newImg)}
                    isEditingAllowed={true}
                    className="h-full w-full object-contain"
                  />
                ) : product.image ? (
                  <img
                    src={String(product.image)}
                    alt={String(product.name || "Product")}
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-[8px] text-slate-400 font-bold">No Image</div>
                )}
              </div>
              <div
                className="p-1.5 text-[8.5px] text-center font-medium"
                style={{ backgroundColor: cardBg, color: textCol }}
              >
                <InlineEditableText
                  value={String(product.name || "Product")}
                  onChange={(newName) => handleUpdateProduct(index, "name", newName)}
                  isEditingAllowed={handlers.isInlineEditingAllowed}
                  className="font-bold truncate block"
                />
                <div className="flex items-center justify-center gap-0.5 font-black text-[8px] mt-0.5 opacity-90">
                  <span>{symbol}</span>
                  <InlineEditableText
                    value={String(product.price || "0")}
                    onChange={(newPr) => handleUpdateProduct(index, "price", newPr)}
                    isEditingAllowed={handlers.isInlineEditingAllowed}
                    className="font-black"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {shopProducts.map((product: BlockRecord, index: number) => (
            <div
              key={product.id || index}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between hover:border-slate-300 relative group/shopprod"
            >
              {handlers.isInlineEditingAllowed && (
                <CanvaInlineItemControls
                  onMoveUp={index > 0 ? () => handleMoveProduct(index, "left") : undefined}
                  onMoveDown={index < shopProducts.length - 1 ? () => handleMoveProduct(index, "right") : undefined}
                  onDelete={() => handleDeleteProduct(index)}
                  isFirst={index === 0}
                  isLast={index === shopProducts.length - 1}
                />
              )}
              <div className="h-32 bg-white flex items-center justify-center p-3">
                {handlers.isInlineEditingAllowed ? (
                  <CanvaInlineImage
                    src={String(product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600")}
                    alt={String(product.name || "Product")}
                    onChange={(newImg) => handleUpdateProduct(index, "image", newImg)}
                    isEditingAllowed={true}
                    className="h-full object-contain max-h-full max-w-full"
                  />
                ) : product.image ? (
                  <img
                    src={String(product.image)}
                    alt={String(product.name || "Product")}
                    className="h-full object-contain max-h-full max-w-full"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="text-xs text-slate-400 font-bold">No Image</div>
                )}
              </div>
              <div
                className="p-3 text-center border-t border-slate-100 flex flex-col items-center justify-center min-h-[56px]"
                style={{ backgroundColor: cardBg, color: textCol }}
              >
                <InlineEditableText
                  value={String(product.name || "Product")}
                  onChange={(newName) => handleUpdateProduct(index, "name", newName)}
                  isEditingAllowed={handlers.isInlineEditingAllowed}
                  className="font-bold text-xs truncate max-w-full leading-tight block"
                />
                <div className="flex items-center justify-center gap-0.5 font-extrabold text-xs mt-0.5 opacity-90">
                  <span>{symbol}</span>
                  <InlineEditableText
                    value={String(product.price || "0")}
                    onChange={(newPr) => handleUpdateProduct(index, "price", newPr)}
                    isEditingAllowed={handlers.isInlineEditingAllowed}
                    className="font-extrabold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {handlers.isInlineEditingAllowed && (
        <CanvaInlineAddButton label="+ Add Shop Product" onClick={handleAddProduct} />
      )}
    </div>
  );
}

export function CouponBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const bgColor = (block.bgColor as string) || "rgb(239 246 255)";
  const textColor = (block.textColor as string) || "#1e3a8a";
  const code = block.value || "MARVELTOYCODE007";

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    if (mode === "preview") {
      handlers.onToast?.("🎟️ Coupon copied to clipboard!");
    } else {
      track(handlers, "click", `Copied Coupon: ${code}`);
      handlers.onToast?.("🎟️ Coupon copied to clipboard!");
    }
  };

  return (
    <div
      style={{ backgroundColor: bgColor, color: textColor }}
      className={`border border-blue-100 relative overflow-hidden text-left shadow-sm ${
        compact ? "p-3 rounded-2xl space-y-1" : "p-4 rounded-2xl space-y-2"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`font-bold uppercase tracking-wider font-mono opacity-80 ${
            compact ? "text-[9px]" : "text-[10px]"
          }`}
          style={{ color: textColor }}
        >
          Special Offer Coupon
        </span>
        <InlineEditableText
          value={(block.discount as string) || "10% OFF"}
          onChange={(newVal) => handlers.onInlineTextChange?.(block.id, "discount", newVal)}
          isEditingAllowed={handlers.isInlineEditingAllowed}
          className={`text-white px-2 py-0.5 rounded-full font-black uppercase text-center ${
            compact ? "text-[7px]" : "text-[8px]"
          }`}
          style={{ backgroundColor: textColor, color: bgColor }}
        />
      </div>
      <div className="flex items-center gap-2">
        <InlineEditableText
          value={code}
          onChange={(newCode) => handlers.onInlineTextChange?.(block.id, "value", newCode)}
          isEditingAllowed={handlers.isInlineEditingAllowed}
          className={`font-mono font-extrabold tracking-widest bg-white/40 rounded-lg border border-dashed text-center ${
            compact ? "text-xs py-0.5 px-2" : "text-sm py-1 px-3"
          }`}
          style={{ color: textColor, borderColor: textColor }}
        />
        <button
          type="button"
          onClick={copyCode}
          className="p-1.5 bg-white/50 hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
          style={{ color: textColor }}
          title="Copy Coupon"
        >
          <Copy className={compact ? "h-3 w-3" : "h-4 w-4"} />
        </button>
      </div>
      <InlineEditableText
        value={block.label}
        onChange={(newLabel) => handlers.onInlineTextChange?.(block.id, "label", newLabel)}
        isEditingAllowed={handlers.isInlineEditingAllowed}
        className={`opacity-90 leading-tight block ${compact ? "text-[9px]" : "text-[10px]"}`}
      />
    </div>
  );
}

export function WhatsAppBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (mode === "preview" && handlers.isInlineEditingAllowed) {
          handlers.onSelectElement?.(block.id, "value");
        } else {
          openWhatsApp(handlers, mode, block.value || "+919876543210", `WhatsApp: ${block.label}`);
        }
      }}
      style={{
        backgroundColor: (block.bgColor as string) || "#25D366",
        color: (block.textColor as string) || "#FFFFFF"
      }}
      className={`w-full font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 border-0 cursor-pointer ${
        compact ? "py-2.5 rounded-xl text-xs gap-1.5" : "py-3.5 rounded-2xl text-sm"
      }`}
    >
      <MessageSquare className={compact ? "h-3.5 w-3.5" : "h-4 w-4 shrink-0"} />
      <InlineEditableText
        value={block.label}
        onChange={(newLabel) => handlers.onInlineTextChange?.(block.id, "label", newLabel)}
        isEditingAllowed={handlers.isInlineEditingAllowed}
        className="truncate"
      />
    </div>
  );
}

export function LinkSpinBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  return (
    <button
      type="button"
      onClick={() => {
        track(handlers, "click", `Spin Wheel: ${block.label}`);
        handlers.onSpinOpen?.(block.id);
      }}
      className={`w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-extrabold transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 ${
        compact ? "py-2.5 rounded-xl text-xs gap-1.5" : "py-3.5 rounded-2xl text-sm"
      }`}
    >
      <span>🎡</span>
      <span>{block.label}</span>
    </button>
  );
}

export function SmartFormBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const leadEmail = handlers.leadEmails?.[block.id] || "";
  const destinationEmail = destinationEmailFromBlock(block);
  const pagePayment = resolvePagePayment(handlers, context);
  const [payState, setPayState] = useState<FormPaymentUiState>("idle");
  const [payError, setPayError] = useState<string | undefined>();
  const [paidAmount, setPaidAmount] = useState<number | undefined>();
  const [pendingEmail, setPendingEmail] = useState("");

  const resetCheckout = () => {
    setPayState("idle");
    setPayError(undefined);
    setPaidAmount(undefined);
  };

  const runSecure = async (email: string) => {
    if (!handlers.onSecureCheckout) return;
    setPayState("processing");
    setPayError(undefined);
    const result = await handlers.onSecureCheckout({
      blockId: block.id,
      fields: { Email: email },
      source: "SMART FORM",
      destinationEmail
    });
    setPayState(result.state);
    setPaidAmount(result.amountInr);
    setPayError(result.errorMessage);
  };

  const handleSubmit = () => {
    if (!leadEmail || !leadEmail.includes("@")) {
      handlers.onToast?.(
        mode === "preview" ? "❌ Please enter your email first." : "Please enter a valid email address."
      );
      return;
    }

    if (pagePayment.enabled && handlers.onSecureCheckout && mode === "live") {
      const email = leadEmail;
      setPendingEmail(email);
      handlers.onLeadEmailChange?.(block.id, "");
      void runSecure(email);
      return;
    }

    if (pagePayment.enabled && mode === "preview") {
      handlers.onLeadSubmit?.(block.id, leadEmail, destinationEmail);
      handlers.onLeadEmailChange?.(block.id, "");
      if (handlers.onSecureCheckout) {
        void handlers
          .onSecureCheckout({
            blockId: block.id,
            fields: { Email: leadEmail },
            source: "SMART FORM",
            destinationEmail
          })
          .then((result) => {
            setPayState(result.state);
            setPaidAmount(result.amountInr ?? pagePayment.amountInr);
            setPayError(result.errorMessage);
          });
        return;
      }
      handlers.onToast?.(
        `Payment skipped in preview${pagePayment.amountInr ? ` (₹${pagePayment.amountInr})` : ""}`
      );
      setPayState("success");
      setPaidAmount(pagePayment.amountInr);
      return;
    }

    handlers.onLeadSubmit?.(block.id, leadEmail, destinationEmail);
    handlers.onLeadEmailChange?.(block.id, "");
    if (handlers.onShowThanks) {
      handlers.onShowThanks();
    } else {
      handlers.onToast?.(
        mode === "preview" ? "✨ Thank you!" : "Thank you! We'll be in touch soon."
      );
    }
  };

  if (payState !== "idle") {
    return (
      <FormPaymentCheckout
        state={payState}
        amountInr={paidAmount ?? pagePayment.amountInr}
        title={handlers.paymentSuccessTitle || "Payment successful"}
        message={handlers.paymentSuccessMessage || "Your payment was verified. Thank you!"}
        errorMessage={payError}
        compact={compact}
        onRetry={() => {
          resetCheckout();
          if (pendingEmail) handlers.onLeadEmailChange?.(block.id, pendingEmail);
        }}
        onDone={resetCheckout}
      />
    );
  }

  return (
    <div
      className={`bg-white border border-slate-200 text-left shadow-sm ${
        compact ? "p-4 rounded-2xl space-y-2" : "p-4.5 rounded-2xl space-y-2.5"
      }`}
    >
      {pagePayment.enabled ? (
        <PaymentRequiredBadge amountInr={pagePayment.amountInr} compact={compact} />
      ) : null}
      <span
        className={`font-bold block text-center text-slate-700 uppercase tracking-widest font-mono ${
          compact ? "text-[9px]" : "text-[10px]"
        }`}
      >
        {block.label}
      </span>
      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        <input
          type="email"
          required
          value={leadEmail}
          onChange={(e) => handlers.onLeadEmailChange?.(block.id, e.target.value)}
          placeholder="Enter your email"
          className={`w-full bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 ${
            compact ? "rounded-lg py-1.5 px-3.5 text-xs" : "rounded-xl py-2 px-3 text-xs"
          }`}
        />
        <button
          type="button"
          onClick={handleSubmit}
          className={`w-full font-bold transition-colors shadow-md ${
            pagePayment.enabled
              ? "bg-[#ec4899] hover:bg-[#db2777] text-white shadow-pink-500/25"
              : "bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-violet-500/25"
          } ${compact ? "py-1.5 rounded-lg text-xs" : "py-2 rounded-xl text-xs"}`}
        >
          {pagePayment.enabled
            ? pagePayment.amountInr
              ? `Pay ₹${pagePayment.amountInr}`
              : "Pay & submit"
            : mode === "preview"
              ? "Submit"
              : "Subscribe"}
        </button>
      </div>
    </div>
  );
}

export function FormBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const destinationEmail = destinationEmailFromBlock(block);
  const submitLabel = getFormSubmitLabel(block);
  const description = typeof block.description === "string" ? block.description.trim() : "";
  const fields = useMemo(() => getFormFields(block), [block]);
  const pagePayment = resolvePagePayment(handlers, context);

  const emptyValues = useMemo(() => {
    const next: FormSubmitPayload = {};
    for (const field of fields) next[field.id] = field.type === "checkbox" ? "No" : "";
    return next;
  }, [fields]);

  const [values, setValues] = useState<FormSubmitPayload>(emptyValues);
  const [payState, setPayState] = useState<FormPaymentUiState>("idle");
  const [payError, setPayError] = useState<string | undefined>();
  const [paidAmount, setPaidAmount] = useState<number | undefined>();

  useEffect(() => {
    setValues(emptyValues);
  }, [emptyValues]);

  const inputClass = `w-full bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 ${
    compact ? "rounded-lg py-1.5 px-3 text-xs" : "rounded-xl py-2 px-3 text-xs"
  }`;

  const updateField = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const resetCheckout = () => {
    setPayState("idle");
    setPayError(undefined);
    setPaidAmount(undefined);
  };

  const handleSubmit = async () => {
    for (const field of fields) {
      const raw = (values[field.id] || "").trim();
      if (field.required) {
        if (field.type === "checkbox") {
          if (raw !== "Yes") {
            handlers.onToast?.(
              mode === "preview"
                ? `❌ Please check "${field.label}".`
                : `Please check "${field.label}".`
            );
            return;
          }
        } else if (!raw) {
          handlers.onToast?.(
            mode === "preview"
              ? `❌ Please fill "${field.label}".`
              : `Please fill "${field.label}".`
          );
          return;
        }
      }
      if (field.type === "email" && raw && !raw.includes("@")) {
        handlers.onToast?.(
          mode === "preview" ? "❌ Please enter a valid email." : "Please enter a valid email address."
        );
        return;
      }
    }

    const payload: FormSubmitPayload = {};
    const labeled: FormSubmitPayload = {};
    for (const field of fields) {
      const raw = values[field.id] ?? "";
      const value =
        field.type === "checkbox" ? (raw === "Yes" ? "Yes" : "No") : String(raw).trim();
      payload[field.id] = value;
      labeled[field.label] = value;
    }

    if (pagePayment.enabled && handlers.onSecureCheckout && mode === "live") {
      setValues(emptyValues);
      setPayState("processing");
      setPayError(undefined);
      const result = await handlers.onSecureCheckout({
        blockId: block.id,
        fields: labeled,
        source: "BIO FORM",
        destinationEmail
      });
      setPayState(result.state);
      setPaidAmount(result.amountInr);
      setPayError(result.errorMessage);
      return;
    }

    if (pagePayment.enabled && mode === "preview") {
      if (handlers.onFormSubmit) {
        handlers.onFormSubmit(block.id, labeled, destinationEmail);
      }
      setValues(emptyValues);
      if (handlers.onSecureCheckout) {
        const result = await handlers.onSecureCheckout({
          blockId: block.id,
          fields: labeled,
          source: "BIO FORM",
          destinationEmail
        });
        setPayState(result.state);
        setPaidAmount(result.amountInr ?? pagePayment.amountInr);
        setPayError(result.errorMessage);
        return;
      }
      handlers.onToast?.(
        `Payment skipped in preview${pagePayment.amountInr ? ` (₹${pagePayment.amountInr})` : ""}`
      );
      setPayState("success");
      setPaidAmount(pagePayment.amountInr);
      return;
    }

    if (handlers.onFormSubmit) {
      handlers.onFormSubmit(block.id, labeled, destinationEmail);
    } else {
      const emailField = fields.find((f) => f.type === "email");
      const email = emailField ? payload[emailField.id] : Object.values(payload).find((v) => v.includes("@"));
      if (email) {
        handlers.onLeadSubmit?.(block.id, email, destinationEmail);
        track(handlers, "register", `Form Lead: ${block.label}`, { email });
      }
    }

    setValues(emptyValues);
    if (handlers.onShowThanks) {
      handlers.onShowThanks();
    } else {
      handlers.onToast?.(
        mode === "preview" ? "✨ Thank you!" : "Thank you! Your submission was received."
      );
    }
  };

  if (payState !== "idle") {
    return (
      <FormPaymentCheckout
        state={payState}
        amountInr={paidAmount ?? pagePayment.amountInr}
        title={handlers.paymentSuccessTitle || "Payment successful"}
        message={handlers.paymentSuccessMessage || "Your payment was verified. Thank you!"}
        errorMessage={payError}
        compact={compact}
        onRetry={resetCheckout}
        onDone={resetCheckout}
      />
    );
  }

  return (
    <div
      className={`bg-white border border-slate-200 text-left shadow-sm ${
        compact ? "p-4 rounded-2xl space-y-2" : "p-4.5 rounded-2xl space-y-2.5"
      }`}
    >
        {pagePayment.enabled ? (
          <PaymentRequiredBadge amountInr={pagePayment.amountInr} compact={compact} />
        ) : null}
        <span className={`font-bold block text-center text-slate-800 ${compact ? "text-xs" : "text-sm"}`}>
          {block.label}
        </span>
        {description ? (
          <p className={`text-center text-slate-500 ${compact ? "text-[10px]" : "text-xs"}`}>{description}</p>
        ) : null}

        {fields.length === 0 ? (
          <p className={`text-center text-slate-400 ${compact ? "text-[10px]" : "text-xs"}`}>
            No form fields configured.
          </p>
        ) : (
          <div className={compact ? "space-y-1.5" : "space-y-2"}>
            {fields.map((field) => {
              const value = values[field.id] ?? "";
              if (field.type === "checkbox") {
                return (
                  <label
                    key={field.id}
                    className={`flex items-center gap-2 text-slate-700 cursor-pointer ${
                      compact ? "text-[10px]" : "text-xs"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={value === "Yes"}
                      onChange={(e) => updateField(field.id, e.target.checked ? "Yes" : "No")}
                      className="rounded border-slate-300 accent-[#7c3aed]"
                    />
                    <span>
                      {field.label}
                      {field.required ? " *" : ""}
                    </span>
                  </label>
                );
              }

              if (field.type === "select") {
                const options = getFormSelectOptions(field);
                return (
                  <select
                    key={field.id}
                    value={value}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    className={inputClass}
                    aria-label={field.label}
                  >
                    <option value="">{field.placeholder || `Select ${field.label}`}</option>
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                );
              }

              if (field.type === "textarea") {
                return (
                  <textarea
                    key={field.id}
                    value={value}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    placeholder={`${field.placeholder || field.label}${field.required ? " *" : ""}`}
                    rows={compact ? 2 : 3}
                    className={`${inputClass} resize-none`}
                    aria-label={field.label}
                  />
                );
              }

              const inputType =
                field.type === "email"
                  ? "email"
                  : field.type === "phone"
                    ? "tel"
                    : field.type === "number"
                      ? "number"
                      : field.type === "url"
                        ? "url"
                        : "text";

              return (
                <input
                  key={field.id}
                  type={inputType}
                  value={value}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  placeholder={`${field.placeholder || field.label}${field.required ? " *" : ""}`}
                  className={inputClass}
                  aria-label={field.label}
                />
              );
            })}
            <button
              type="button"
              onClick={() => void handleSubmit()}
              className={`w-full font-bold transition-colors shadow-md ${
                pagePayment.enabled
                  ? "bg-[#ec4899] hover:bg-[#db2777] text-white shadow-pink-500/25"
                  : "bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-violet-500/25"
              } ${compact ? "py-1.5 rounded-lg text-xs" : "py-2 rounded-xl text-xs"}`}
            >
              {pagePayment.enabled
                ? pagePayment.amountInr
                  ? `Pay ₹${pagePayment.amountInr}`
                  : "Pay & submit"
                : submitLabel}
            </button>
          </div>
        )}
    </div>
  );
}

export function FaqBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const items = getFaqItems(block);
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const handleUpdateFaqQuestion = (itemId: string, newQ: string) => {
    const updated = items.map((it) => (it.id === itemId ? { ...it, question: newQ } : it));
    handlers.onInlineTextChange?.(block.id, "faqItems", updated);
  };

  const handleUpdateFaqAnswer = (itemId: string, newA: string) => {
    const updated = items.map((it) => (it.id === itemId ? { ...it, answer: newA } : it));
    handlers.onInlineTextChange?.(block.id, "faqItems", updated);
  };

  const handleMoveFaq = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const item = copy.splice(index, 1)[0];
    copy.splice(target, 0, item);
    handlers.onInlineTextChange?.(block.id, "faqItems", copy);
  };

  const handleDeleteFaq = (itemId: string) => {
    const copy = items.filter((it) => it.id !== itemId);
    handlers.onInlineTextChange?.(block.id, "faqItems", copy);
  };

  const handleAddFaq = () => {
    const newFaq = {
      id: `faq_${Date.now()}`,
      question: "New Question — click to edit?",
      answer: "Write your answer here..."
    };
    handlers.onInlineTextChange?.(block.id, "faqItems", [...items, newFaq]);
  };

  return (
    <div
      className={`bg-white border border-slate-200 shadow-sm ${
        compact ? "rounded-2xl p-3 space-y-2" : "rounded-2xl p-4 space-y-2.5"
      }`}
    >
      <InlineEditableText
        value={block.label}
        onChange={(newLabel) => handlers.onInlineTextChange?.(block.id, "label", newLabel)}
        isEditingAllowed={handlers.isInlineEditingAllowed}
        className={`font-bold block text-center text-slate-800 ${compact ? "text-xs" : "text-sm"}`}
      />
      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const open = openId === item.id;
          return (
            <div key={item.id} className="border border-slate-100 rounded-xl overflow-hidden relative group/faqitem">
              {handlers.isInlineEditingAllowed && (
                <CanvaInlineItemControls
                  onMoveUp={idx > 0 ? () => handleMoveFaq(idx, "up") : undefined}
                  onMoveDown={idx < items.length - 1 ? () => handleMoveFaq(idx, "down") : undefined}
                  onDelete={() => handleDeleteFaq(item.id)}
                  isFirst={idx === 0}
                  isLast={idx === items.length - 1}
                />
              )}
              <div
                onClick={() => {
                  setOpenId(open ? null : item.id);
                  track(handlers, "click", `FAQ: ${item.question}`);
                }}
                className={`w-full text-left font-semibold text-slate-800 flex items-center justify-between gap-2 cursor-pointer ${
                  compact ? "px-2.5 py-2 text-[10px]" : "px-3 py-2.5 text-xs"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <InlineEditableText
                    value={item.question}
                    onChange={(newQ) => handleUpdateFaqQuestion(item.id, newQ)}
                    isEditingAllowed={handlers.isInlineEditingAllowed}
                  />
                </div>
                <span className="text-slate-400 shrink-0 select-none">{open ? "−" : "+"}</span>
              </div>
              {open && (
                <div
                  className={`text-slate-500 border-t border-slate-100 ${
                    compact ? "px-2.5 py-2 text-[10px]" : "px-3 py-2.5 text-xs"
                  }`}
                >
                  <InlineEditableText
                    value={item.answer}
                    onChange={(newA) => handleUpdateFaqAnswer(item.id, newA)}
                    isEditingAllowed={handlers.isInlineEditingAllowed}
                    multiline
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {handlers.isInlineEditingAllowed && (
        <CanvaInlineAddButton label="+ Add FAQ Question" onClick={handleAddFaq} />
      )}
    </div>
  );
}

export function TestimonialsBlockView({ block, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const items = getTestimonials(block);

  const handleUpdateTestimonial = (itemId: string, field: "quote" | "author" | "role", val: string) => {
    const updated = items.map((it) => (it.id === itemId ? { ...it, [field]: val } : it));
    handlers.onInlineTextChange?.(block.id, "testimonials", updated);
  };

  const handleMoveTestimonial = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const item = copy.splice(index, 1)[0];
    copy.splice(target, 0, item);
    handlers.onInlineTextChange?.(block.id, "testimonials", copy);
  };

  const handleDeleteTestimonial = (itemId: string) => {
    const copy = items.filter((it) => it.id !== itemId);
    handlers.onInlineTextChange?.(block.id, "testimonials", copy);
  };

  const handleAddTestimonial = () => {
    const newTestimonial = {
      id: `test_${Date.now()}`,
      quote: "Outstanding experience and lightning fast support!",
      author: "Alex Morgan",
      role: "Verified Client"
    };
    handlers.onInlineTextChange?.(block.id, "testimonials", [...items, newTestimonial]);
  };

  return (
    <div
      className={`bg-white border border-slate-200 shadow-sm ${
        compact ? "rounded-2xl p-3 space-y-2" : "rounded-2xl p-4 space-y-3"
      }`}
    >
      <InlineEditableText
        value={block.label}
        onChange={(newLabel) => handlers.onInlineTextChange?.(block.id, "label", newLabel)}
        isEditingAllowed={handlers.isInlineEditingAllowed}
        className={`font-bold block text-center text-slate-800 ${compact ? "text-xs" : "text-sm"}`}
      />
      <div className={`grid grid-cols-1 ${!compact && items.length > 1 ? "md:grid-cols-2" : "grid-cols-1"} ${compact ? "gap-2.5" : "gap-3"}`}>
        {items.map((item, idx) => (
          <blockquote
            key={item.id}
            className={`bg-slate-50 border border-slate-100 rounded-xl relative group/testitem ${
              compact ? "p-2.5" : "p-3"
            }`}
          >
            {handlers.isInlineEditingAllowed && (
              <CanvaInlineItemControls
                onMoveUp={idx > 0 ? () => handleMoveTestimonial(idx, "up") : undefined}
                onMoveDown={idx < items.length - 1 ? () => handleMoveTestimonial(idx, "down") : undefined}
                onDelete={() => handleDeleteTestimonial(item.id)}
                isFirst={idx === 0}
                isLast={idx === items.length - 1}
              />
            )}
            <div className={`text-slate-700 italic ${compact ? "text-[10px]" : "text-xs"}`}>
              <span>“</span>
              <InlineEditableText
                value={item.quote}
                onChange={(newQ) => handleUpdateTestimonial(item.id, "quote", newQ)}
                isEditingAllowed={handlers.isInlineEditingAllowed}
                multiline
                tagName="span"
              />
              <span>”</span>
            </div>
            <footer className={`mt-1.5 text-slate-500 font-semibold flex items-center gap-1 ${compact ? "text-[9px]" : "text-[10px]"}`}>
              <span>—</span>
              <InlineEditableText
                value={item.author}
                onChange={(newA) => handleUpdateTestimonial(item.id, "author", newA)}
                isEditingAllowed={handlers.isInlineEditingAllowed}
                className="font-bold text-slate-700"
              />
              <span>,</span>
              <InlineEditableText
                value={item.role || (handlers.isInlineEditingAllowed ? "Role" : "")}
                onChange={(newR) => handleUpdateTestimonial(item.id, "role", newR)}
                isEditingAllowed={handlers.isInlineEditingAllowed}
                className="text-slate-400"
              />
            </footer>
          </blockquote>
        ))}
      </div>
      {handlers.isInlineEditingAllowed && (
        <CanvaInlineAddButton label="+ Add Testimonial" onClick={handleAddTestimonial} />
      )}
    </div>
  );
}

export function TipJarBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const options = getTipOptions(block);
  return (
    <div
      className={`bg-white border border-slate-200 shadow-sm ${
        compact ? "rounded-2xl p-3 space-y-2" : "rounded-2xl p-4 space-y-2.5"
      }`}
    >
      <span className={`font-bold block text-center text-slate-800 ${compact ? "text-xs" : "text-sm"}`}>
        {block.label}
      </span>
      {typeof block.description === "string" && block.description.trim() ? (
        <p className={`text-center text-slate-500 ${compact ? "text-[10px]" : "text-xs"}`}>
          {block.description}
        </p>
      ) : null}
      <div className="space-y-1.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              track(handlers, "click", `Tip: ${option.label}`);
              openLink(handlers, mode, option.url || block.value || "", option.label);
            }}
            className={`w-full flex items-center justify-between gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold transition-colors ${
              compact ? "rounded-lg px-2.5 py-2 text-[10px]" : "rounded-xl px-3 py-2.5 text-xs"
            }`}
          >
            <span className="truncate">{option.label}</span>
            {option.amount ? <span className="shrink-0 font-mono">{option.amount}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MapBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const resolved = resolveGoogleMap(block);
  const address = typeof block.address === "string" ? block.address.trim() : "";
  const showAddress = String(block.showAddress ?? "Yes").toLowerCase() !== "no";
  const buttonLabel =
    (typeof block.buttonLabel === "string" && block.buttonLabel.trim()) || "Open in Google Maps";
  const mapHeight =
    block.mapHeight === "sm" ? (compact ? "h-28" : "h-32") : block.mapHeight === "lg" ? (compact ? "h-48" : "h-56") : compact ? "h-36" : "h-44";

  const openMaps = () => {
    track(handlers, "click", `Map: ${block.label}`);
    openLink(handlers, mode, resolved.openUrl, block.label);
  };

  return (
    <div
      className={`bg-white border border-slate-200 shadow-sm overflow-hidden ${
        compact ? "rounded-2xl" : "rounded-2xl"
      }`}
    >
      <div className={compact ? "p-3 space-y-2" : "p-4 space-y-2.5"}>
        <span className={`font-bold block text-center text-slate-800 ${compact ? "text-xs" : "text-sm"}`}>
          {block.label}
        </span>
        {typeof block.subtext === "string" && block.subtext.trim() ? (
          <p className={`text-center text-slate-500 ${compact ? "text-[10px]" : "text-xs"}`}>{block.subtext}</p>
        ) : null}
      </div>

      {resolved.hasLocation && resolved.embedUrl ? (
        <div className={`relative w-full ${mapHeight} bg-slate-100 border-y border-slate-100`}>
          <iframe
            title={`Map: ${resolved.queryLabel || block.label}`}
            src={resolved.embedUrl}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
        <div
          className={`mx-3 mb-3 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 ${
            compact ? "h-24 text-[10px]" : "h-28 text-xs"
          }`}
        >
          <MapPin className="h-4 w-4 text-rose-400" />
          <span>Add a Google Maps URL or address</span>
        </div>
      )}

      <div className={compact ? "p-3 space-y-2" : "p-4 space-y-2.5"}>
        {showAddress && (address || resolved.queryLabel) ? (
          <div className={`flex items-start gap-2 text-slate-600 ${compact ? "text-[10px]" : "text-xs"}`}>
            <MapPin className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} text-rose-500 shrink-0 mt-0.5`} />
            <span className="leading-snug">{address || resolved.queryLabel}</span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={openMaps}
          disabled={!resolved.hasLocation && !resolved.openUrl}
          className={`w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold transition-colors ${
            compact ? "rounded-lg py-1.5 text-[10px]" : "rounded-xl py-2 text-xs"
          }`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export function ImageBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const imageUrl =
    (typeof block.imageUrl === "string" && block.imageUrl.trim()) ||
    (typeof block.value === "string" && block.value.trim()) ||
    "";
  const linkUrl = typeof block.linkUrl === "string" ? block.linkUrl.trim() : "";
  const caption = typeof block.caption === "string" ? block.caption.trim() : "";
  const altText =
    (typeof block.altText === "string" && block.altText.trim()) || block.label || "Image";

  const handleUpdateImage = (newSrc: string) => {
    handlers.onInlineTextChange?.(block.id, "imageUrl", newSrc);
    handlers.onInlineTextChange?.(block.id, "value", newSrc);
  };

  const content = (
    <div className="w-full flex flex-col items-center">
      {handlers.isInlineEditingAllowed ? (
        <CanvaInlineImage
          src={imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800"}
          alt={altText}
          onChange={handleUpdateImage}
          isEditingAllowed={true}
          className={`w-full object-cover ${compact ? "max-h-36" : "max-h-52"}`}
        />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={altText}
          className={`w-full object-cover ${compact ? "max-h-36" : "max-h-48"}`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`w-full bg-slate-100 text-slate-400 flex items-center justify-center ${
            compact ? "h-28 text-[10px]" : "h-36 text-xs"
          }`}
        >
          Add an image URL
        </div>
      )}
      <InlineEditableText
        value={caption || (handlers.isInlineEditingAllowed ? "Click to add caption..." : "")}
        onChange={(newCap) => handlers.onInlineTextChange?.(block.id, "caption", newCap)}
        isEditingAllowed={handlers.isInlineEditingAllowed}
        className={`text-center text-slate-500 px-2 py-1.5 block ${compact ? "text-[10px]" : "text-xs"}`}
      />
    </div>
  );

  if (linkUrl) {
    return (
      <button
        type="button"
        onClick={() => {
          if (mode === "preview" && handlers.isInlineEditingAllowed) {
            handlers.onSelectElement?.(block.id, "linkUrl");
          } else {
            track(handlers, "click", `Image: ${block.label}`);
            openLink(handlers, mode, linkUrl, block.label);
          }
        }}
        className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-0 text-left cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">{content}</div>;
}

export function DividerBlockView({ block, context }: BlockViewProps) {
  const compact = context.compact;
  const style = typeof block.style === "string" ? block.style : "line";
  const spacing = typeof block.spacing === "string" ? block.spacing : "md";
  const pad = spacing === "sm" ? (compact ? "py-1" : "py-2") : spacing === "lg" ? (compact ? "py-4" : "py-6") : compact ? "py-2" : "py-3";

  if (style === "space") {
    return <div className={pad} aria-hidden />;
  }

  if (style === "dots") {
    return (
      <div className={`flex items-center justify-center gap-1.5 text-slate-300 ${pad}`} aria-hidden>
        <span>•</span>
        <span>•</span>
        <span>•</span>
      </div>
    );
  }

  return (
    <div className={pad} aria-hidden>
      <div className="h-px w-full bg-slate-200" />
    </div>
  );
}

export function VCardBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  return (
    <button
      type="button"
      onClick={() => {
        if (mode === "preview") {
          handlers.onToast?.("🪪 Simulated vCard contact info download saved to phone Contacts!");
          return;
        }
        if (handlers.onVCardDownload) {
          handlers.onVCardDownload(block);
          return;
        }
        const contactName =
          (typeof block.contactName === "string" && block.contactName.trim()) ||
          context.displayTitle ||
          block.label;
        const phone =
          (typeof block.phone === "string" && block.phone.trim()) ||
          (block.value?.includes("@") ? "" : block.value);
        const email =
          (typeof block.email === "string" && block.email.trim()) ||
          (block.value?.includes("@") ? block.value : destinationEmailFromBlock(block));
        downloadVCard({
          name: contactName,
          phone,
          email,
          handle: context.displayHandle
        });
        track(handlers, "click", `vCard Contact: ${block.label}`);
        handlers.onToast?.("Contact card downloaded to your device.");
      }}
      className={`w-full bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 border-0 ${
        compact ? "py-2.5 rounded-xl text-xs gap-1.5" : "py-3.5 rounded-2xl text-sm"
      }`}
    >
      <User className={compact ? "h-3.5 w-3.5 text-gray-400" : "h-4 w-4 text-slate-400"} />
      <span className="truncate">{block.label}</span>
    </button>
  );
}

export function VideoBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const thumb = getVideoThumbnail(block);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
      <button
        type="button"
        className={`w-full bg-slate-950 flex items-center justify-center relative group cursor-pointer border-0 p-0 ${
          compact ? "h-32" : "h-44"
        }`}
        onClick={() => {
          track(handlers, "click", `Video: ${block.label}`);
          if (mode === "preview") {
            handlers.onToast?.(`🎥 Playing Video: ${block.value || "https://youtube.com"}`);
            return;
          }
          openLink(handlers, mode, block.value || "", block.label);
        }}
      >
        <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url('${thumb}')` }} />
        <div
          className={`absolute bg-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-md transform group-hover:scale-110 transition-transform ${
            compact ? "h-10 w-10 text-lg" : "h-12 w-12 text-xl"
          }`}
        >
          ▶
        </div>
      </button>
      <div className={compact ? "p-2.5 text-left" : "p-3 text-left"}>
        <span className={`font-bold text-slate-800 block truncate ${compact ? "text-[10px]" : "text-xs"}`}>
          {block.label}
        </span>
      </div>
    </div>
  );
}

export function MusicBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const subtext = (block.subtext as string) || "Tap to listen";
  return (
    <button
      type="button"
      className={`w-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm flex items-center justify-between cursor-pointer border-0 ${
        compact ? "p-3 rounded-2xl gap-3" : "p-4 rounded-2xl gap-3"
      }`}
      onClick={() => {
        track(handlers, "click", `Music Track: ${block.label}`);
        if (mode === "preview") {
          handlers.onToast?.(`🎵 Playing Audio: ${block.value || "Soundtrack"}`);
          return;
        }
        openLink(handlers, mode, block.value || "", block.label);
      }}
    >
      <div className={`flex items-center min-w-0 ${compact ? "gap-2.5" : "gap-3"}`}>
        <span className={compact ? "text-xl" : "text-2xl"}>🎵</span>
        <div className="min-w-0 text-left">
          <span className={`font-bold block truncate ${compact ? "text-[10px]" : "text-xs"}`}>{block.label}</span>
          <span className={`text-indigo-200 block ${compact ? "text-[8px] font-bold" : "text-[10px]"}`}>{subtext}</span>
        </div>
      </div>
      <div
        className={`bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white shrink-0 ${
          compact ? "h-7 w-7" : "h-9 w-9"
        }`}
      >
        ▶
      </div>
    </button>
  );
}

export function CallBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const phone = getCallPhone(block);
  const subtext = typeof block.subtext === "string" ? block.subtext.trim() : "";
  const bgColor = (typeof block.bgColor === "string" && block.bgColor) || "#0f172a";
  const textColor = (typeof block.textColor === "string" && block.textColor) || "#ffffff";

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <button
        type="button"
        className={`w-full font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] border-0 ${
          compact ? "py-2.5 rounded-xl text-xs gap-1.5" : "py-3.5 rounded-2xl text-sm"
        }`}
        style={{ backgroundColor: bgColor, color: textColor }}
        onClick={() => {
          if (!phone) {
            handlers.onToast?.("Phone number is not configured yet.");
            return;
          }
          track(handlers, "click", `Call: ${block.label}`);
          if (mode === "preview") {
            handlers.onToast?.(`📞 Calling ${phone}`);
            return;
          }
          openLink(handlers, mode, buildTelUrl(phone), block.label);
        }}
      >
        <Phone className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <span className="truncate">{block.label}</span>
      </button>
      {subtext ? (
        <p className={`text-center opacity-70 ${compact ? "text-[10px]" : "text-xs"}`} style={{ color: textColor }}>
          {subtext}
        </p>
      ) : null}
    </div>
  );
}

export function EmailBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const email = getEmailAddress(block);
  const subject = typeof block.subject === "string" ? block.subject : "";
  const subtext = typeof block.subtext === "string" ? block.subtext.trim() : "";
  const bgColor = (typeof block.bgColor === "string" && block.bgColor) || "#4f46e5";
  const textColor = (typeof block.textColor === "string" && block.textColor) || "#ffffff";

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <button
        type="button"
        className={`w-full font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] border-0 ${
          compact ? "py-2.5 rounded-xl text-xs gap-1.5" : "py-3.5 rounded-2xl text-sm"
        }`}
        style={{ backgroundColor: bgColor, color: textColor }}
        onClick={() => {
          if (!email) {
            handlers.onToast?.("Email address is not configured yet.");
            return;
          }
          track(handlers, "click", `Email: ${block.label}`);
          const mailUrl = buildMailtoUrl(email, subject);
          if (mode === "preview") {
            handlers.onToast?.(`✉️ Email to ${email}`);
            return;
          }
          openLink(handlers, mode, mailUrl, block.label);
        }}
      >
        <Mail className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <span className="truncate">{block.label}</span>
      </button>
      {subtext ? (
        <p className={`text-center text-slate-500 ${compact ? "text-[10px]" : "text-xs"}`}>{subtext}</p>
      ) : null}
    </div>
  );
}

const BANNER_STYLES: Record<string, { bg: string; border: string; title: string; body: string }> = {
  info: { bg: "#eff6ff", border: "#bfdbfe", title: "#1e3a8a", body: "#1d4ed8" },
  success: { bg: "#ecfdf5", border: "#a7f3d0", title: "#065f46", body: "#047857" },
  warning: { bg: "#fffbeb", border: "#fde68a", title: "#92400e", body: "#b45309" },
  promo: { bg: "#faf5ff", border: "#e9d5ff", title: "#581c87", body: "#7e22ce" }
};

export function BannerBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const styleKey = getBannerStyle(block);
  const palette = BANNER_STYLES[styleKey] || BANNER_STYLES.info;
  const emoji = typeof block.bannerEmoji === "string" ? block.bannerEmoji : "📢";
  const title = typeof block.bannerTitle === "string" ? block.bannerTitle.trim() : block.label;
  const message = typeof block.bannerMessage === "string" ? block.bannerMessage.trim() : "";
  const link = typeof block.bannerLink === "string" ? block.bannerLink.trim() : "";
  const linkLabel = typeof block.bannerLinkLabel === "string" ? block.bannerLinkLabel.trim() : "Learn more";

  const inner = (
    <div
      className={`rounded-2xl border text-left ${compact ? "p-3 space-y-1.5" : "p-4 space-y-2"}`}
      style={{ backgroundColor: palette.bg, borderColor: palette.border }}
    >
      <div className={`flex items-start gap-2 ${compact ? "text-xs" : "text-sm"}`}>
        {handlers.isInlineEditingAllowed ? (
          <CanvaInlineIcon
            value={emoji}
            onChange={(newEmoji) => handlers.onInlineTextChange?.(block.id, "bannerEmoji", newEmoji)}
            isEditingAllowed={true}
            className={compact ? "text-lg" : "text-xl"}
          />
        ) : (
          <span className={compact ? "text-lg" : "text-xl"} aria-hidden>{emoji}</span>
        )}
        <div className="min-w-0 flex-1">
          <InlineEditableText
            value={title}
            onChange={(newT) => {
              handlers.onInlineTextChange?.(block.id, "bannerTitle", newT);
              handlers.onInlineTextChange?.(block.id, "label", newT);
            }}
            isEditingAllowed={handlers.isInlineEditingAllowed}
            className="font-bold leading-snug block"
            style={{ color: palette.title }}
          />
          <InlineEditableText
            value={message || (handlers.isInlineEditingAllowed ? "Click to add announcement message..." : "")}
            onChange={(newM) => handlers.onInlineTextChange?.(block.id, "bannerMessage", newM)}
            isEditingAllowed={handlers.isInlineEditingAllowed}
            multiline
            className={`leading-relaxed block ${compact ? "text-[10px] mt-0.5" : "text-xs mt-1"}`}
            style={{ color: palette.body }}
          />
          {link ? (
            <span
              className={`inline-flex items-center gap-1 font-bold mt-1.5 ${compact ? "text-[10px]" : "text-xs"}`}
              style={{ color: palette.title }}
            >
              <InlineEditableText
                value={linkLabel}
                onChange={(newL) => handlers.onInlineTextChange?.(block.id, "bannerLinkLabel", newL)}
                isEditingAllowed={handlers.isInlineEditingAllowed}
              />
              <ArrowRight className="h-3 w-3" />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!link) return inner;

  return (
    <div
      role="button"
      tabIndex={0}
      className="w-full p-0 border-0 bg-transparent text-left cursor-pointer"
      onClick={() => {
        if (mode === "preview" && handlers.isInlineEditingAllowed) {
          handlers.onSelectElement?.(block.id, "bannerLink");
        } else {
          track(handlers, "click", `Banner: ${title}`);
          openLink(handlers, mode, link, title);
        }
      }}
    >
      {inner}
    </div>
  );
}

export function StatsBlockView({ block, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const items = getStatItems(block);

  const handleUpdateStat = (itemId: string, field: "value" | "label", val: string) => {
    const updated = items.map((it) => (it.id === itemId ? { ...it, [field]: val } : it));
    handlers.onInlineTextChange?.(block.id, "statItems", updated);
  };

  const handleMoveStat = (index: number, direction: "left" | "right") => {
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const item = copy.splice(index, 1)[0];
    copy.splice(target, 0, item);
    handlers.onInlineTextChange?.(block.id, "statItems", copy);
  };

  const handleDeleteStat = (itemId: string) => {
    const copy = items.filter((it) => it.id !== itemId);
    handlers.onInlineTextChange?.(block.id, "statItems", copy);
  };

  const handleAddStat = () => {
    const newStat = {
      id: `stat_${Date.now()}`,
      value: "10K+",
      label: "New Metric"
    };
    handlers.onInlineTextChange?.(block.id, "statItems", [...items, newStat]);
  };

  return (
    <div
      className={`bg-white border border-slate-200 shadow-sm ${
        compact ? "rounded-2xl p-3" : "rounded-2xl p-4"
      }`}
    >
      {block.label ? (
        <InlineEditableText
          value={block.label}
          onChange={(newVal) => handlers.onInlineTextChange?.(block.id, "label", newVal)}
          isEditingAllowed={handlers.isInlineEditingAllowed}
          className={`font-bold block text-center text-slate-800 mb-2 ${compact ? "text-xs" : "text-sm"}`}
        />
      ) : null}
      <div
        className={`grid gap-2 ${
          items.length >= 4
            ? "grid-cols-2 sm:grid-cols-4"
            : items.length === 3
              ? "grid-cols-3"
              : items.length === 2
                ? "grid-cols-2"
                : "grid-cols-1"
        }`}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`text-center rounded-xl bg-slate-50 border border-slate-100 relative group/statitem ${
              compact ? "px-2 py-2" : "px-3 py-2.5"
            }`}
          >
            {handlers.isInlineEditingAllowed && (
              <CanvaInlineItemControls
                onMoveUp={idx > 0 ? () => handleMoveStat(idx, "left") : undefined}
                onMoveDown={idx < items.length - 1 ? () => handleMoveStat(idx, "right") : undefined}
                onDelete={() => handleDeleteStat(item.id)}
                isFirst={idx === 0}
                isLast={idx === items.length - 1}
              />
            )}
            <InlineEditableText
              value={item.value}
              onChange={(newVal) => handleUpdateStat(item.id, "value", newVal)}
              isEditingAllowed={handlers.isInlineEditingAllowed}
              className={`font-display font-black text-[#6366f1] block ${compact ? "text-sm" : "text-base"}`}
            />
            <InlineEditableText
              value={item.label}
              onChange={(newVal) => handleUpdateStat(item.id, "label", newVal)}
              isEditingAllowed={handlers.isInlineEditingAllowed}
              className={`text-slate-500 font-semibold block ${compact ? "text-[9px] mt-0.5" : "text-[10px] mt-1"}`}
            />
          </div>
        ))}
      </div>
      {handlers.isInlineEditingAllowed && (
        <CanvaInlineAddButton label="+ Add Metric Item" onClick={handleAddStat} />
      )}
    </div>
  );
}

export function PricingBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const plans = getPricingPlans(block);
  const description = typeof block.description === "string" ? block.description.trim() : "";

  const handleUpdatePlan = (planId: string, field: "name" | "price" | "period" | "description", val: string) => {
    const updated = plans.map((p) => (p.id === planId ? { ...p, [field]: val } : p));
    handlers.onInlineTextChange?.(block.id, "pricingPlans", updated);
  };

  const handleUpdatePlanFeatures = (planId: string, features: string[]) => {
    const updated = plans.map((p) => (p.id === planId ? { ...p, features: features.join("\n") } : p));
    handlers.onInlineTextChange?.(block.id, "pricingPlans", updated);
  };

  const handleMovePlan = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= plans.length) return;
    const copy = [...plans];
    const item = copy.splice(index, 1)[0];
    copy.splice(target, 0, item);
    handlers.onInlineTextChange?.(block.id, "pricingPlans", copy);
  };

  const handleDeletePlan = (planId: string) => {
    const copy = plans.filter((p) => p.id !== planId);
    handlers.onInlineTextChange?.(block.id, "pricingPlans", copy);
  };

  const handleAddPlan = () => {
    const newPlan = {
      id: `plan_${Date.now()}`,
      name: "Enterprise Pro",
      price: "₹1,999",
      period: "/month",
      description: "Complete power suite for fast scaling",
      features: "Unlimited custom links\n24/7 dedicated support\nInstant analytics",
      url: "https://keylink360.today",
      highlighted: false
    };
    handlers.onInlineTextChange?.(block.id, "pricingPlans", [...plans, newPlan]);
  };

  return (
    <div className={`space-y-2 ${compact ? "pt-1" : "pt-2"}`}>
      <InlineEditableText
        value={block.label}
        onChange={(newVal) => handlers.onInlineTextChange?.(block.id, "label", newVal)}
        isEditingAllowed={handlers.isInlineEditingAllowed}
        className={`font-bold block text-center text-slate-800 ${compact ? "text-xs" : "text-sm"}`}
      />
      <InlineEditableText
        value={description || (handlers.isInlineEditingAllowed ? "Pick the plan that fits you best" : "")}
        onChange={(newVal) => handlers.onInlineTextChange?.(block.id, "description", newVal)}
        isEditingAllowed={handlers.isInlineEditingAllowed}
        className={`text-center text-slate-500 block ${compact ? "text-[10px]" : "text-xs"}`}
      />
      <div
        className={`grid grid-cols-1 ${
          plans.length >= 3 ? "sm:grid-cols-2 md:grid-cols-3" : plans.length === 2 ? "sm:grid-cols-2" : "grid-cols-1"
        } ${compact ? "gap-2" : "gap-3"}`}
      >
        {plans.map((plan, idx) => {
          const features = getPricingPlanFeatures(plan);
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border bg-white shadow-sm relative group/planitem ${
                plan.highlighted ? "border-[#6366f1] ring-1 ring-[#6366f1]/25" : "border-slate-200"
              } ${compact ? "p-3" : "p-4"}`}
            >
              {handlers.isInlineEditingAllowed && (
                <CanvaInlineItemControls
                  onMoveUp={idx > 0 ? () => handleMovePlan(idx, "up") : undefined}
                  onMoveDown={idx < plans.length - 1 ? () => handleMovePlan(idx, "down") : undefined}
                  onDelete={() => handleDeletePlan(plan.id)}
                  isFirst={idx === 0}
                  isLast={idx === plans.length - 1}
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <InlineEditableText
                    value={plan.name}
                    onChange={(newVal) => handleUpdatePlan(plan.id, "name", newVal)}
                    isEditingAllowed={handlers.isInlineEditingAllowed}
                    className={`font-bold text-slate-900 block ${compact ? "text-xs" : "text-sm"}`}
                  />
                  <InlineEditableText
                    value={plan.description || (handlers.isInlineEditingAllowed ? "Short description" : "")}
                    onChange={(newVal) => handleUpdatePlan(plan.id, "description", newVal)}
                    isEditingAllowed={handlers.isInlineEditingAllowed}
                    className={`text-slate-500 block ${compact ? "text-[10px]" : "text-xs"}`}
                  />
                </div>
                <div className="text-right shrink-0">
                  <InlineEditableText
                    value={plan.price}
                    onChange={(newVal) => handleUpdatePlan(plan.id, "price", newVal)}
                    isEditingAllowed={handlers.isInlineEditingAllowed}
                    className={`font-black text-[#6366f1] block ${compact ? "text-sm" : "text-base"}`}
                  />
                  {plan.period ? (
                    <InlineEditableText
                      value={plan.period}
                      onChange={(newVal) => handleUpdatePlan(plan.id, "period", newVal)}
                      isEditingAllowed={handlers.isInlineEditingAllowed}
                      className={`text-slate-400 block ${compact ? "text-[9px]" : "text-[10px]"}`}
                    />
                  ) : null}
                </div>
              </div>
              {features.length > 0 ? (
                <ul className={`mt-2 space-y-0.5 text-slate-600 ${compact ? "text-[10px]" : "text-xs"}`}>
                  {features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center justify-between group/featureitem">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <InlineEditableText
                          value={feature}
                          onChange={(newF) => {
                            const updatedF = [...features];
                            updatedF[fIdx] = newF;
                            handleUpdatePlanFeatures(plan.id, updatedF);
                          }}
                          isEditingAllowed={handlers.isInlineEditingAllowed}
                        />
                      </div>
                      {handlers.isInlineEditingAllowed && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedF = features.filter((_, i) => i !== fIdx);
                            handleUpdatePlanFeatures(plan.id, updatedF);
                          }}
                          className="opacity-0 group-hover/featureitem:opacity-100 p-0.5 text-rose-400 hover:text-rose-600 rounded"
                          title="Delete Feature"
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
              {handlers.isInlineEditingAllowed && (
                <button
                  type="button"
                  onClick={() => handleUpdatePlanFeatures(plan.id, [...features, "New feature benefit"])}
                  className="mt-1 text-[9px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline block"
                >
                  + Add Feature
                </button>
              )}
              {plan.url ? (
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "preview" && handlers.isInlineEditingAllowed) {
                      handlers.onSelectElement?.(block.id, "pricingPlans");
                    } else {
                      track(handlers, "click", `Pricing: ${plan.name}`);
                      openLink(handlers, mode, plan.url, plan.name);
                    }
                  }}
                  className={`mt-2.5 w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold transition-colors cursor-pointer ${
                    compact ? "py-1.5 rounded-lg text-[10px]" : "py-2 rounded-xl text-xs"
                  }`}
                >
                  Choose {plan.name}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {handlers.isInlineEditingAllowed && (
        <CanvaInlineAddButton label="+ Add Pricing Tier" onClick={handleAddPlan} />
      )}
    </div>
  );
}

export function GalleryBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const items = getGalleryItems(block);

  const handleUpdateItem = (index: number, newUrl: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], url: newUrl };
    handlers.onInlineTextChange?.(block.id, "galleryItems", updated);
  };

  const handleDeleteItem = (index: number) => {
    const copy = items.filter((_, idx) => idx !== index);
    handlers.onInlineTextChange?.(block.id, "galleryItems", copy);
  };

  const handleAddItem = () => {
    const newItem = {
      id: `gal_${Date.now()}`,
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
      caption: "Showcase Image",
      linkUrl: ""
    };
    handlers.onInlineTextChange?.(block.id, "galleryItems", [...items, newItem]);
  };

  return (
    <div className={`text-left ${compact ? "space-y-1.5" : "space-y-2 pt-2"}`}>
      <InlineEditableText
        value={block.label}
        onChange={(newLabel) => handlers.onInlineTextChange?.(block.id, "label", newLabel)}
        isEditingAllowed={handlers.isInlineEditingAllowed}
        className={`font-bold text-slate-400 block uppercase tracking-wider ${
          compact ? "text-[9px]" : "text-[10px] font-mono"
        }`}
      />
      {items.length > 0 ? (
        <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 ${compact ? "gap-1.5" : "gap-2"}`}>
          {items.map((item, index) => {
            const targetUrl = item.linkUrl.trim() || item.url;
            return (
              <div
                key={item.id}
                className={`relative overflow-hidden rounded-xl border border-slate-100 group/galcell ${compact ? "h-14" : "h-20"}`}
              >
                {handlers.isInlineEditingAllowed ? (
                  <>
                    <CanvaInlineImage
                      src={item.url}
                      alt={item.caption || `Gallery ${index + 1}`}
                      onChange={(newUrl) => handleUpdateItem(index, newUrl)}
                      isEditingAllowed={true}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="absolute top-1 right-1 z-30 opacity-0 group-hover/galcell:opacity-100 p-0.5 rounded bg-rose-900/90 text-rose-300 hover:text-white"
                      title="Delete Image"
                    >
                      ✕
                    </button>
                  </>
                ) : mode === "live" && targetUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      track(handlers, "click", `Gallery ${index + 1}: ${block.label}`);
                      handlers.onExternalLink?.(targetUrl, item.caption || block.label);
                    }}
                    className="w-full h-full p-0 text-left cursor-pointer"
                  >
                    <img
                      src={item.url}
                      alt={item.caption || `Gallery ${index + 1}`}
                      className="h-full w-full object-cover hover:opacity-90 transition-opacity"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption || `Gallery ${index + 1}`}
                    className="h-full w-full object-cover hover:opacity-90 transition-opacity"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                )}
                {item.caption ? (
                  <span
                    className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white truncate pointer-events-none ${
                      compact ? "text-[8px] px-1 py-0.5" : "text-[9px] px-1.5 py-1"
                    }`}
                  >
                    {item.caption}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className={`text-slate-400 text-center py-2 ${compact ? "text-[9px]" : "text-[10px]"}`}>
          Add gallery images in block settings
        </p>
      )}
      {handlers.isInlineEditingAllowed && (
        <CanvaInlineAddButton label="+ Add Gallery Image" onClick={handleAddItem} />
      )}
    </div>
  );
}

export function PdfBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const fileSize = (block.fileSize as string) || "";
  return (
    <button
      type="button"
      className={`w-full bg-white border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors cursor-pointer shadow-sm text-left ${
        compact ? "p-3 rounded-2xl gap-3" : "p-4 rounded-2xl gap-3"
      }`}
      onClick={() => {
        track(handlers, "click", `PDF Download: ${block.label}`);
        if (mode === "preview") {
          handlers.onToast?.(`📄 Opening PDF Catalog: ${block.value || "catalog.pdf"}`);
          return;
        }
        openLink(handlers, mode, block.value || "", block.label);
      }}
    >
      <div className={`flex items-center min-w-0 ${compact ? "gap-2" : "gap-2.5"}`}>
        <span className={compact ? "text-xl" : "text-2xl"}>📄</span>
        <div className="min-w-0">
          <span className={`font-bold block text-slate-800 truncate ${compact ? "text-[10px]" : "text-xs"}`}>
            {block.label}
          </span>
          <span className={`text-slate-400 block font-mono ${compact ? "text-[8px]" : "text-[10px] mt-0.5"}`}>
            PDF Document{fileSize ? ` • ${fileSize}` : ""}
          </span>
        </div>
      </div>
      <span
        className={`bg-slate-100 text-slate-600 rounded-xl font-bold shrink-0 ${
          compact ? "text-xs px-2 py-1 rounded-lg" : "text-xs px-3 py-1.5"
        }`}
      >
        {compact ? "GET" : "OPEN"}
      </span>
    </button>
  );
}

export function EventsBlockView({ block, mode, context, handlers }: BlockViewProps) {
  const compact = context.compact;
  const eventMonth = (block.eventMonth as string) || "JUL";
  const eventDay = (block.eventDay as string) || "20";
  const eventMeta = (block.subtext as string) || "Tap to RSVP";

  return (
    <button
      type="button"
      className={`w-full bg-white border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors cursor-pointer shadow-sm text-left ${
        compact ? "p-3 rounded-2xl gap-3" : "p-4 rounded-2xl gap-3"
      }`}
      onClick={() => {
        track(handlers, "click", `Event RSVP: ${block.label}`);
        if (mode === "preview") {
          handlers.onToast?.(`📅 RSVP Successful for Event: ${block.label}`);
          return;
        }
        openLink(handlers, mode, block.value || "", block.label);
      }}
    >
      <div className={`flex items-center min-w-0 ${compact ? "gap-2.5" : "gap-3"}`}>
        <div
          className={`bg-violet-50 border border-violet-100 text-violet-600 text-center shrink-0 font-bold ${
            compact ? "rounded-lg p-1 min-w-[34px]" : "rounded-xl p-1.5 min-w-[42px]"
          }`}
        >
          <span className={`block uppercase leading-none font-mono ${compact ? "text-[8px]" : "text-[9px]"}`}>
            {eventMonth}
          </span>
          <span className={`block leading-none mt-0.5 ${compact ? "text-xs" : "text-sm"}`}>{eventDay}</span>
        </div>
        <div className="min-w-0">
          <span className={`font-bold block text-slate-800 truncate ${compact ? "text-[10px]" : "text-xs"}`}>
            {block.label}
          </span>
          <span className={`text-slate-500 block ${compact ? "text-[8px]" : "text-[10px] mt-0.5"}`}>{eventMeta}</span>
        </div>
      </div>
      <span
        className={`bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold shadow-md shadow-violet-500/25 shrink-0 ${
          compact ? "text-[9px] px-2.5 py-1.5 rounded-lg tracking-wide" : "text-xs px-4 py-2 rounded-xl"
        }`}
      >
        RSVP
      </span>
    </button>
  );
}

export function CountdownBlockViewWrapper({ block, context }: BlockViewProps) {
  return <CountdownBlockView block={block} compact={context.compact} />;
}

export function DefaultBlockView({ block, mode, handlers }: BlockViewProps) {
  return (
    <button
      type="button"
      onClick={() => {
        track(handlers, "click", `Action Block: ${block.label}`);
        if (mode === "preview") {
          handlers.onToast?.(`✨ Clicked block: ${block.label}`);
          return;
        }
        if (block.value && block.value !== block.label) {
          handlers.onExternalLink?.(block.value, block.label);
        } else {
          handlers.onToast?.(`${block.label} is not configured yet.`);
        }
      }}
      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-2xl text-xs shadow-sm border border-slate-200 transition-colors"
    >
      {block.label}
    </button>
  );
}

export function renderBlockView(props: BlockViewProps): React.ReactNode {
  switch (props.block.type) {
    case "Header":
      return <HeaderBlockView {...props} />;
    case "Text":
      return <TextBlockView {...props} />;
    case "Button":
    case "Deep Link":
      return <LinkButtonBlockView {...props} />;
    case "Socials":
      return <SocialsBlockView {...props} />;
    case "Shop":
      return <ShopBlockView {...props} />;
    case "Coupon":
      return <CouponBlockView {...props} />;
    case "Countdown":
      return <CountdownBlockViewWrapper {...props} />;
    case "Link Spin":
      return <LinkSpinBlockView {...props} />;
    case "WhatsApp":
      return <WhatsAppBlockView {...props} />;
    case "Smart Form":
      return <SmartFormBlockView {...props} />;
    case "Form":
      return <FormBlockView {...props} />;
    case "FAQ":
      return <FaqBlockView {...props} />;
    case "Testimonials":
      return <TestimonialsBlockView {...props} />;
    case "Tip Jar":
      return <TipJarBlockView {...props} />;
    case "Map":
      return <MapBlockView {...props} />;
    case "Image":
      return <ImageBlockView {...props} />;
    case "Divider":
      return <DividerBlockView {...props} />;
    case "vCard":
      return <VCardBlockView {...props} />;
    case "Video":
      return <VideoBlockView {...props} />;
    case "Music":
      return <MusicBlockView {...props} />;
    case "Gallery":
      return <GalleryBlockView {...props} />;
    case "Call":
      return <CallBlockView {...props} />;
    case "Email":
      return <EmailBlockView {...props} />;
    case "Banner":
      return <BannerBlockView {...props} />;
    case "Stats":
      return <StatsBlockView {...props} />;
    case "Pricing":
      return <PricingBlockView {...props} />;
    case "PDF":
      return <PdfBlockView {...props} />;
    case "Events":
      return <EventsBlockView {...props} />;
    // Developer-Grade Blocks
    case "Split Hero":
      return <SplitHeroBlockView {...props} />;
    case "Video Hero":
      return <VideoHeroBlockView {...props} />;
    case "Glow Badge":
      return <GlowBadgeBlockView {...props} />;
    case "Feature Hero":
      return <FeatureHeroBlockView {...props} />;
    case "Toggle Pricing":
      return <TogglePricingBlockView {...props} />;
    case "Product Showcase":
      return <ProductShowcaseBlockView {...props} />;
    case "Comparison Table":
      return <ComparisonTableBlockView {...props} />;
    case "Payment Button":
      return <PaymentButtonBlockView {...props} />;
    case "Brand Logos":
      return <BrandLogosBlockView {...props} />;
    case "Star Ratings":
      return <StarRatingsBlockView {...props} />;
    case "Press Mentions":
      return <PressMentionsBlockView {...props} />;
    case "Before/After":
    case "Before/After Slider":
    case "Before After":
      return <BeforeAfterSliderBlockView {...props} />;
    case "Portfolio":
    case "Portfolio Gallery":
    case "Projects":
      return <PortfolioGalleryBlockView {...props} />;
    case "Video Showcase":
    case "Video Playlist":
      return <VideoShowcaseBlockView {...props} />;
    case "Podcast Player":
    case "Audio Player":
    case "Podcast":
      return <AudioPlayerBlockView {...props} />;
    case "Multi-Step Form":
    case "Multistep Form":
    case "Lead Funnel":
      return <MultiStepFormBlockView {...props} />;
    case "Lead Magnet":
    case "Ebook Download":
    case "PDF Download":
      return <LeadMagnetBlockView {...props} />;
    case "Meeting Booker":
    case "Book Call":
    case "Calendly":
      return <MeetingBookerBlockView {...props} />;
    case "Newsletter":
    case "Newsletter Box":
    case "Email Subscribe":
      return <NewsletterBlockView {...props} />;
    // Persona & Pro Blocks
    case "Navbar":
    case "Navigation Bar":
    case "Header Nav":
      return <NavbarBlockView {...props} />;
    case "Footer":
    case "Footer Bar":
      return <FooterBlockView {...props} />;
    case "Main Feature":
    case "Features Grid":
    case "Feature Pillars":
      return <MainFeatureBlockView {...props} />;
    case "Auto Slider":
    case "Slider":
    case "Image Slider":
    case "Carousel":
      return <AutoSliderBlockView {...props} />;
    case "Google Form":
    case "Embed Form":
      return <GoogleFormBlockView {...props} />;
    case "Flash Offer":
    case "Promotion":
    case "Special Offer":
    case "Promo Banner":
      return <FlashOfferBlockView {...props} />;
    case "Community Hub":
    case "Community":
    case "VIP Group":
      return <CommunityHubBlockView {...props} />;
    case "YouTube Channel":
    case "YouTube":
    case "Video Stream":
      return <YouTubeChannelBlockView {...props} />;
    case "Instagram Feed":
    case "Instagram":
    case "Social Feed":
      return <InstagramFeedBlockView {...props} />;
    default:
      return <DefaultBlockView {...props} />;
  }
}
