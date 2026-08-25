import React, { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { BlockRecord } from "../../lib/bioBlocks";
import { filterVisibleBioBlocks, normalizeExternalUrl } from "../../lib/bioBlocks";
import BlockRenderer, { type BlockRendererHandlers } from "./BlockRenderer";

export type ThankYouPageViewProps = {
  open: boolean;
  title?: string;
  message?: string;
  emoji?: string;
  blocks?: BlockRecord[];
  onBack: () => void;
  /** Compact phone preview vs live public */
  compact?: boolean;
  handlers?: BlockRendererHandlers;
  displayTitle?: string;
};

export const DEFAULT_THANK_YOU_MESSAGE =
  "Thanks for connecting with us on KEYLINK360. Your details were received — our team will follow up shortly.";

export const DEFAULT_THANK_YOU_BRAND =
  "KEYLINK360 helps you share your bio, capture leads, and grow your brand from one page.";

const DEFAULT_BLOCKS: BlockRecord[] = [
  {
    id: "ty_header",
    type: "Header",
    label: "Thank you!",
    value: "Thank you!"
  },
  {
    id: "ty_text",
    type: "Text",
    label: DEFAULT_THANK_YOU_BRAND,
    value: DEFAULT_THANK_YOU_BRAND
  },
  {
    id: "ty_cta",
    type: "Button",
    label: "Back to page",
    value: "",
    bgColor: "#ec4899",
    textColor: "#FFFFFF"
  }
];

function formatStatusTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false });
}

function DeviceStatusBar() {
  const [time, setTime] = useState(() => formatStatusTime());

  useEffect(() => {
    const tick = () => setTime(formatStatusTime());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="key-thankyou-page__status" aria-hidden>
      <span className="key-thankyou-page__status-time">{time}</span>
      <span className="key-thankyou-page__status-icons">
        <svg className="key-thankyou-page__status-icon" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="7" width="3" height="5" rx="0.6" />
          <rect x="5" y="5" width="3" height="7" rx="0.6" />
          <rect x="10" y="2.5" width="3" height="9.5" rx="0.6" />
          <rect x="15" y="0" width="3" height="12" rx="0.6" opacity="0.35" />
        </svg>
        <svg className="key-thankyou-page__status-icon" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 3.2c1.9 0 3.6.7 4.9 1.9l1.1-1.2A8.4 8.4 0 0 0 8 1.1 8.4 8.4 0 0 0 2 3.9l1.1 1.2A6.6 6.6 0 0 1 8 3.2zm0 3.1c1 0 1.9.4 2.6 1l1.1-1.2A5.1 5.1 0 0 0 8 4.8a5.1 5.1 0 0 0-3.7 1.3l1.1 1.2A3.5 3.5 0 0 1 8 6.3zm0 4.6a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z" />
        </svg>
        <span className="key-thankyou-page__status-battery">
          <span className="key-thankyou-page__status-battery-level" />
          <span className="key-thankyou-page__status-battery-cap" />
        </span>
        <span className="key-thankyou-page__status-pct">100%</span>
      </span>
    </div>
  );
}

/** Native-style 2nd page after form submit — not a popup. Back returns to the bio page. */
export default function ThankYouPageView({
  open,
  title = "Thank You",
  message,
  emoji = "✓",
  blocks,
  onBack,
  compact = false,
  handlers = {},
  displayTitle
}: ThankYouPageViewProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
  }, [open, blocks, title, message, emoji]);

  if (!open) return null;

  const safeHandlers: BlockRendererHandlers = {
    ...handlers,
    deferThanksUntilPaid: false,
    paymentAmountInr: undefined,
    onSecureCheckout: undefined
  };

  const visible = filterVisibleBioBlocks(blocks?.length ? blocks : DEFAULT_BLOCKS);
  const heroTitle =
    (typeof visible[0]?.label === "string" && visible[0].type === "Header"
      ? visible[0].label
      : null) || "Thank you!";
  const afterHero = visible[0]?.type === "Header" ? visible.slice(1) : visible;

  const ctaIndex = [...afterHero]
    .map((b, i) => ({ b, i }))
    .reverse()
    .find(({ b }) => {
      if (b.type !== "Button") return false;
      const raw = String(b.value || "").trim();
      return !raw || raw === "https://";
    })?.i;
  const ctaBlock = ctaIndex != null ? afterHero[ctaIndex] : null;

  const bodyBlocks = afterHero.filter((_, i) => (ctaIndex != null ? i !== ctaIndex : true));

  const handleCta = () => {
    if (!ctaBlock) return;
    const openThanks =
      ctaBlock.openThanksPage === true ||
      ctaBlock.openThanksPage === "Yes" ||
      ctaBlock.openThanksPage === "true";
    if (openThanks) return;
    const raw = String(ctaBlock.value || "").trim();
    const url = raw ? normalizeExternalUrl(raw) : "";
    if (url && url !== "https://" && handlers.onExternalLink) {
      handlers.onExternalLink(url, ctaBlock.label);
      return;
    }
    if (url && url !== "https://") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    onBack();
  };

  return (
    <div
      className={`key-thankyou-page ${compact ? "key-thankyou-page--compact" : "key-thankyou-page--public"}`}
      role="region"
      aria-labelledby="key-thankyou-title"
    >
      <DeviceStatusBar />

      <header className="key-thankyou-page__nav">
        <button
          type="button"
          onClick={onBack}
          className="key-thankyou-page__back"
          aria-label="Back to page"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.4} />
        </button>
        <h2 id="key-thankyou-title" className="key-thankyou-page__nav-title">
          {title}
        </h2>
        <span className="key-thankyou-page__nav-spacer" aria-hidden />
      </header>

      <div className="key-thankyou-page__scroll" ref={scrollRef}>
        <div className="key-thankyou-page__hero">
          <div className="key-thankyou-page__hero-art" aria-hidden>
            <span className="key-thankyou-page__spark key-thankyou-page__spark--1" />
            <span className="key-thankyou-page__spark key-thankyou-page__spark--2" />
            <span className="key-thankyou-page__spark key-thankyou-page__spark--3" />
            <span className="key-thankyou-page__balloon key-thankyou-page__balloon--a" />
            <span className="key-thankyou-page__balloon key-thankyou-page__balloon--b" />
            <span className="key-thankyou-page__balloon key-thankyou-page__balloon--c" />
            <span className="key-thankyou-page__confetti" />
            <div className="key-thankyou-page__check">{emoji === "✓" ? "✓" : emoji}</div>
          </div>
          <h3 className="key-thankyou-page__heading">{heroTitle}</h3>
          {message ? <p className="key-thankyou-page__message">{message}</p> : null}
        </div>

        {bodyBlocks.length > 0 ? (
          <div className="key-thankyou-page__blocks">
            {bodyBlocks.map((block) => (
              <div key={block.id} className="key-thankyou-page__block" data-block-type={block.type}>
                <BlockRenderer
                  block={block}
                  mode="live"
                  context={{
                    compact: true,
                    displayTitle,
                    // Thank You never inherits page-level Razorpay settings.
                    paymentEnabled: false,
                    paymentAmountInr: undefined
                  }}
                  handlers={safeHandlers}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {ctaBlock ? (
        <div className="key-thankyou-page__footer">
          <button
            type="button"
            className="key-thankyou-page__cta"
            style={{
              background: String(ctaBlock.bgColor || "#ec4899"),
              color: String(ctaBlock.textColor || "#FFFFFF")
            }}
            onClick={handleCta}
          >
            {ctaBlock.label || "Continue"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function createDefaultThankYouBlocks(): BlockRecord[] {
  return [
    {
      id: `ty_h_${Date.now()}`,
      type: "Header",
      label: "Thank you!",
      value: "Thank you!"
    },
    {
      id: `ty_t_${Date.now() + 1}`,
      type: "Text",
      label: DEFAULT_THANK_YOU_BRAND,
      value: DEFAULT_THANK_YOU_BRAND
    },
    {
      id: `ty_btn_${Date.now() + 2}`,
      type: "Button",
      label: "Back to page",
      value: "",
      bgColor: "#ec4899",
      textColor: "#FFFFFF"
    }
  ];
}
