import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Download, Calendar, Mail, FileText, Lock, Users } from "lucide-react";
import type { BlockRecord } from "../../../lib/bioBlocks";
import type { BlockRendererContext, BlockRendererHandlers, BlockRenderMode } from "../blockTypes";

interface DeveloperBlockProps {
  block: BlockRecord;
  mode: BlockRenderMode;
  context: BlockRendererContext;
  handlers: BlockRendererHandlers;
}

/**
 * 16. Multi-Step Form Block:
 * 3-step interactive lead capture form with progress indicator.
 */
export function MultiStepFormBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const formTitle = (block.formTitle as string) || block.label || "Get Your Free Strategy Consultation";
  const steps = Array.isArray(block.steps)
    ? (block.steps as any[])
    : [
        {
          stepNumber: 1,
          stepTitle: "Your Contact",
          fields: [
            { id: "name", label: "Full Name", placeholder: "e.g. John Doe" },
            { id: "email", label: "Email Address", placeholder: "john@example.com" }
          ]
        },
        {
          stepNumber: 2,
          stepTitle: "Your Project",
          fields: [
            { id: "budget", label: "Estimated Monthly Budget", placeholder: "e.g. ₹25,000 - ₹50,000" },
            { id: "goal", label: "Main Business Goal", placeholder: "e.g. Double monthly leads" }
          ]
        },
        {
          stepNumber: 3,
          stepTitle: "Confirmation",
          fields: [
            { id: "phone", label: "Phone / WhatsApp", placeholder: "+91 98765 43210" }
          ]
        }
      ];

  const totalSteps = steps.length;
  const currentStepData = steps.find((s) => s.stepNumber === currentStep) || steps[0];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      setSubmitted(true);
      if (mode === "preview") {
        handlers.onToast?.("🎉 Multi-step form submitted successfully in preview!");
      } else {
        handlers.onFormSubmit?.(block.id, formData);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (submitted) {
    return (
      <div className="w-full rounded-3xl p-6 bg-emerald-950/60 border border-emerald-500/40 text-center text-white space-y-3 shadow-xl">
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
        <h4 className="font-display font-black text-lg text-white">Thank You! Submission Received</h4>
        <p className="text-xs text-emerald-200">
          We have received your details and will be in touch shortly with your custom strategy.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 text-left">
      <div>
        <h4 className="font-display font-black text-base sm:text-lg text-white">{formTitle}</h4>
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
          <span>
            Step {currentStep} of {totalSteps}: <strong className="text-indigo-400">{currentStepData.stepTitle}</strong>
          </span>
          <span className="font-mono text-[11px]">{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Fields for Active Step */}
      <div className="space-y-3">
        {(currentStepData.fields || []).map((f: any) => (
          <div key={f.id} className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">{f.label}</label>
            <input
              type="text"
              placeholder={f.placeholder}
              value={formData[f.id] || ""}
              onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-white placeholder:text-slate-600"
            />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handlePrev}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            Back
          </button>
        ) : <div />}

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all ml-auto"
        >
          <span>{currentStep === totalSteps ? "Submit Application" : "Continue"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * 17. Lead Magnet Download Block:
 * High-converting opt-in offering instant PDF download with email capture.
 */
export function LeadMagnetBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const badgeText = (block.badgeText as string) || "🎁 FREE EBOOK / PDF GUIDE";
  const title = (block.title as string) || block.label || "The Ultimate 2026 Bio-Link Conversion Blueprint";
  const description = (block.description as string) || (block.value as string) || "Download our step-by-step 48-page playbook that helped 1,200+ creators generate over ₹1 Crore in sales.";
  const coverImage = (block.coverImage as string) || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400";
  const fileSize = (block.fileSize as string) || "14.2 MB PDF";
  const buttonText = (block.buttonText as string) || "Instant Free Download";
  const downloadUrl = (block.downloadUrl as string) || "https://example.com/blueprint.pdf";

  const handleDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setUnlocked(true);
    if (mode === "preview") {
      handlers.onToast?.(`🎉 Lead Magnet unlocked for: ${email}`);
    } else {
      handlers.onLeadSubmit?.(block.id, email);
    }
  };

  return (
    <div className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl text-white box-border">
      <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4 sm:gap-5 items-center w-full min-w-0">
        <div className="w-full max-w-[180px] sm:max-w-none mx-auto aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md shrink-0">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="w-full sm:col-span-2 min-w-0 space-y-2.5 sm:space-y-3 text-left flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-block self-start">
            {badgeText}
          </span>
          <h4 className="font-display font-black text-base sm:text-lg text-white leading-snug break-words">
            {title}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed break-words">
            {description}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span>Format: {fileSize}</span>
          </div>

          {!unlocked ? (
            <form onSubmit={handleDownload} className="pt-2 flex flex-col sm:flex-row gap-2 w-full">
              <input
                type="email"
                required
                placeholder="Enter your email to unlock..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{buttonText}</span>
              </button>
            </form>
          ) : (
            <div className="pt-2 w-full">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
              >
                <Download className="h-4 w-4" />
                <span>Click here to download {fileSize}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 18. Meeting Booker / Calendly Embed Block:
 * 1-on-1 discovery call booking card.
 */
export function MeetingBookerBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const hostName = (block.hostName as string) || "Vignesh (Founder)";
  const hostRole = (block.hostRole as string) || "Growth & Product Strategist";
  const avatarUrl = (block.avatarUrl as string) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150";
  const meetingTitle = (block.meetingTitle as string) || block.label || "15-Minute 1-on-1 Growth Discovery Call";
  const description = (block.description as string) || (block.value as string) || "Let's review your landing page and discuss how KeyLink360 can double your visitor conversions.";
  const durationMinutes = (block.durationMinutes as string) || "15 mins";
  const bookingUrl = (block.bookingUrl as string) || "https://calendly.com";
  const buttonText = (block.buttonText as string) || "Schedule Call Now 🗓️";

  const handleBook = () => {
    if (mode === "preview") {
      handlers.onToast?.(`Simulated call booking link: ${bookingUrl}`);
      return;
    }
    handlers.onExternalLink?.(bookingUrl, meetingTitle);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl text-left space-y-4">
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl}
          alt={hostName}
          className="h-12 w-12 rounded-full ring-2 ring-indigo-500/40 object-cover"
        />
        <div>
          <h4 className="font-bold text-sm text-white">{hostName}</h4>
          <span className="text-[11px] text-indigo-400 font-medium">{hostRole}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>{durationMinutes} Video Meeting</span>
        </div>
        <h3 className="font-display font-black text-base text-white">{meetingTitle}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>

      <button
        type="button"
        onClick={handleBook}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Calendar className="h-4 w-4" />
        <span>{buttonText}</span>
      </button>
    </div>
  );
}

/**
 * 19. Newsletter Box Block:
 * Email newsletter subscription card with social proof subscriber count.
 */
export function NewsletterBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const title = (block.title as string) || block.label || "Join The Weekly Growth Dispatch";
  const subtitle = (block.subtitle as string) || (block.value as string) || "Every Tuesday, get 1 actionable marketing tip to grow your brand. No spam, ever.";
  const buttonLabel = (block.buttonLabel as string) || "Subscribe Free";
  const subscriberBadge = (block.subscriberBadge as string) || "Join 12,400+ smart founders & creators";

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    if (mode === "preview") {
      handlers.onToast?.(`🎉 Subscribed to newsletter: ${email}`);
    } else {
      handlers.onLeadSubmit?.(block.id, email);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl text-center space-y-3">
      {subscriberBadge && (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
          <Users className="h-3 w-3" />
          <span>{subscriberBadge}</span>
        </div>
      )}

      <h4 className="font-display font-black text-lg text-white">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">{subtitle}</p>

      {!subscribed ? (
        <form onSubmit={handleSubscribe} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input
            type="email"
            required
            placeholder="Enter your email address..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600"
          />
          <button
            type="submit"
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all shrink-0"
          >
            {buttonLabel}
          </button>
        </form>
      ) : (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300">
          🎉 You're subscribed! Check your inbox for the welcome issue.
        </div>
      )}
    </div>
  );
}
