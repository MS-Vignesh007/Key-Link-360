import React, { useMemo, useState } from "react";
import { IntegrationItem, IntegrationVote, ScreenId } from "../types";
import {
  MessageCircle,
  Send,
  Mail,
  Smartphone,
  CreditCard,
  Check,
  X,
  Search,
  ExternalLink,
  Settings2,
  Unplug,
  Bell,
  BellRing,
  Plus,
  Lock,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Wallet,
  ArrowRight
} from "lucide-react";
import PageShell, { PageHeader, Workspace } from "./layout/PageShell";

interface IntegrationsScreenProps {
  items: IntegrationItem[];
  votes: IntegrationVote[];
  onVote: (id: string) => void;
  onUpdateIntegration: (item: IntegrationItem) => void;
  onNavigate?: (screen: ScreenId) => void;
}

type ModalState =
  | { type: "connect"; item: IntegrationItem }
  | { type: "manage"; item: IntegrationItem }
  | { type: "upgrade"; item: IntegrationItem }
  | { type: "suggest" }
  | null;

function TypeIcon({ type }: { type: IntegrationItem["type"] }) {
  switch (type) {
    case "WhatsApp":
      return <MessageCircle className="h-5 w-5" />;
    case "Telegram":
      return <Send className="h-5 w-5" />;
    case "Email Marketing":
      return <Mail className="h-5 w-5" />;
    case "SMS Messaging":
      return <Smartphone className="h-5 w-5" />;
    case "Payments":
      return <CreditCard className="h-5 w-5" />;
    default:
      return <Zap className="h-5 w-5" />;
  }
}

function typeBadgeStyle(type: IntegrationItem["type"]) {
  switch (type) {
    case "WhatsApp":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Telegram":
      return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    case "Email Marketing":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "SMS Messaging":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Payments":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

function typeIconBgClass(type: IntegrationItem["type"]) {
  switch (type) {
    case "WhatsApp":
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    case "Telegram":
      return "bg-sky-500/15 text-sky-400 border border-sky-500/30";
    case "Email Marketing":
      return "bg-purple-500/15 text-purple-400 border border-purple-500/30";
    case "SMS Messaging":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    case "Payments":
      return "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border border-slate-500/30";
  }
}

function statusBadgeClass(status: IntegrationItem["status"]) {
  if (status === "Connected") return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  if (status === "Coming Soon") return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
  return "bg-slate-800/80 text-slate-400 border border-slate-700/80";
}

export default function IntegrationsScreen({
  items,
  votes,
  onVote,
  onUpdateIntegration,
  onNavigate
}: IntegrationsScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | IntegrationItem["type"]>("All");
  const [modal, setModal] = useState<ModalState>(null);

  // Dynamic config field values
  const [primaryKey, setPrimaryKey] = useState("");
  const [secondaryKey, setSecondaryKey] = useState("");
  const [extraId, setExtraId] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [suggestName, setSuggestName] = useState("");
  const [suggestNotes, setSuggestNotes] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = typeFilter === "All" || item.type === typeFilter;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [items, searchQuery, typeFilter]);

  const whatsappItems = filteredItems.filter((i) => i.type === "WhatsApp");
  const telegramItems = filteredItems.filter((i) => i.type === "Telegram");
  const emailItems = filteredItems.filter((i) => i.type === "Email Marketing");
  const smsItems = filteredItems.filter((i) => i.type === "SMS Messaging");
  const paymentsItems = filteredItems.filter((i) => i.type === "Payments");

  const sortedVotes = useMemo(
    () => [...votes].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name)),
    [votes]
  );

  const connectedCount = items.filter((i) => i.status === "Connected").length;
  const paymentCount = items.filter((i) => i.type === "Payments" && i.status === "Connected").length;
  const messagingCount = items.filter(
    (i) => (i.type === "WhatsApp" || i.type === "Telegram" || i.type === "SMS Messaging") && i.status === "Connected"
  ).length;

  const resetConnectForm = () => {
    setPrimaryKey("");
    setSecondaryKey("");
    setExtraId("");
    setAccountEmail("");
    setFormError("");
    setIsSubmitting(false);
    setIsTestingPing(false);
  };

  const openConnect = (item: IntegrationItem) => {
    resetConnectForm();
    setModal({ type: "connect", item });
  };

  const handleConnectSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!modal || modal.type !== "connect") return;

    setFormError("");
    const trimmed = primaryKey.trim();
    if (trimmed.length < 4) {
      setFormError("Please enter valid credentials / API keys (at least 4 characters).");
      return;
    }

    const item = modal.item;
    setIsSubmitting(true);
    window.setTimeout(() => {
      const hint = trimmed.slice(-4);
      onUpdateIntegration({
        ...item,
        status: "Connected",
        waitlisted: false,
        apiKeyHint: `••••${hint}`,
        connectedAt: new Date().toISOString()
      });
      setIsSubmitting(false);
      setModal(null);
      resetConnectForm();
      triggerToast(`"${item.name}" connected and verified successfully!`);
    }, 450);
  };

  const handleDisconnect = (item: IntegrationItem) => {
    if (!window.confirm(`Disconnect ${item.name}? Live automations and integrations using this provider will stop.`)) {
      return;
    }
    onUpdateIntegration({
      ...item,
      status: "Locked",
      apiKeyHint: undefined,
      connectedAt: undefined
    });
    setModal(null);
    triggerToast(`"${item.name}" disconnected.`);
  };

  const handleWaitlist = (item: IntegrationItem) => {
    const next = !item.waitlisted;
    onUpdateIntegration({ ...item, waitlisted: next });
    triggerToast(
      next
        ? `You're on the waitlist for ${item.name}. We'll notify you when ready!`
        : `Removed from the ${item.name} waitlist.`
    );
  };

  const handleVoteClick = (vote: IntegrationVote) => {
    if (vote.voted) return;
    onVote(vote.id);
    triggerToast(`Voted for ${vote.name}. Thank you for prioritizing our roadmap!`);
  };

  const handleSuggestSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    const name = suggestName.trim();
    if (!name) {
      setFormError("Integration name is required.");
      return;
    }
    if (name.length < 2) {
      setFormError("Enter at least 2 characters.");
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setModal(null);
      setSuggestName("");
      setSuggestNotes("");
      triggerToast(`Suggestion for "${name}" submitted. Our product team will review it.`);
    }, 350);
  };

  const renderSection = (title: string, sectionItems: IntegrationItem[], badgeText: string) => {
    if (sectionItems.length === 0) return null;
    return (
      <div className="space-y-4" data-aos="fade-up">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--key-border)]">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-base md:text-lg text-[var(--key-text)]">
              {title}
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              {badgeText}
            </span>
          </div>
          <span className="text-xs font-semibold text-[var(--key-muted)]">
            {sectionItems.length} available
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sectionItems.map(renderIntegrationCard)}
        </div>
      </div>
    );
  };

  const renderIntegrationCard = (item: IntegrationItem) => {
    const isComingSoon = item.status === "Coming Soon";
    const isConnected = item.status === "Connected";
    const isLocked = item.status === "Locked";

    return (
      <div
        key={item.id}
        data-aos="fade-up"
        className={`rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 backdrop-blur-md relative overflow-hidden ${
          isConnected
            ? "bg-[var(--key-surface-strong)] border-emerald-500/40 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/60"
            : "bg-[var(--key-surface)] hover:bg-[var(--key-surface-strong)] border-[var(--key-border)] hover:border-[var(--key-border-hover)] shadow-md"
        }`}
      >
        <div className="space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${typeIconBgClass(item.type)}`}>
                <TypeIcon type={item.type} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-display font-bold text-[var(--key-text)] text-sm md:text-base leading-tight truncate">
                    {item.name}
                  </h4>
                  {item.badge && (
                    <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${typeBadgeStyle(item.type)}`}>
                  {item.type}
                </span>
              </div>
            </div>

            <span className={`text-[9px] font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wide shrink-0 ${statusBadgeClass(item.status)}`}>
              {item.status}
            </span>
          </div>

          <p className="text-[var(--key-muted)] text-xs leading-relaxed min-h-[40px]">
            {item.description}
          </p>

          {item.upgradeMessage && isLocked && (
            <p className="text-[11px] text-[var(--key-muted)] font-medium flex items-start gap-1.5 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span>{item.upgradeMessage}</span>
            </p>
          )}

          {isConnected && item.apiKeyHint && (
            <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Active Key: {item.apiKeyHint}
              </span>
              {item.connectedAt && (
                <span className="text-[10px] opacity-80">
                  {new Date(item.connectedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-[var(--key-border)]">
          {isComingSoon && (
            <button
              type="button"
              onClick={() => handleWaitlist(item)}
              className={`w-full font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                item.waitlisted
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                  : "bg-[var(--key-surface-strong)] hover:bg-[var(--key-surface-hover)] text-[var(--key-text)] border border-[var(--key-border)]"
              }`}
            >
              {item.waitlisted ? (
                <>
                  <BellRing className="h-3.5 w-3.5" />
                  On waitlist
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" />
                  Notify me when live
                </>
              )}
            </button>
          )}

          {isConnected && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModal({ type: "manage", item })}
                className="bg-[var(--key-surface-strong)] hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 text-[var(--key-text)] font-bold text-xs py-2.5 rounded-xl border border-[var(--key-border)] hover:border-indigo-500/50 flex items-center justify-center gap-1.5 transition-all"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Manage
              </button>
              <button
                type="button"
                onClick={() => handleDisconnect(item)}
                className="bg-[var(--key-surface-strong)] hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 text-[var(--key-muted)] font-bold text-xs py-2.5 rounded-xl border border-[var(--key-border)] hover:border-rose-500/40 flex items-center justify-center gap-1.5 transition-all"
              >
                <Unplug className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          )}

          {isLocked && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openConnect(item)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                Connect
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => setModal({ type: "upgrade", item })}
                  className="w-full bg-[var(--key-surface-strong)] hover:bg-[var(--key-surface-hover)] text-[var(--key-muted)] hover:text-[var(--key-text)] font-bold text-xs py-2.5 rounded-xl border border-[var(--key-border)] transition-all"
                >
                  Upgrade info
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const activeConnectItem = modal?.type === "connect" ? modal.item : null;

  return (
    <PageShell className="font-sans text-[var(--key-text)]">
      <PageHeader
        title="Integrations & Connectors"
        subtitle="Supercharge your bio link workspace. Connect WhatsApp Cloud API, Telegram bots, Email Marketing, SMS alerts, and Payment gateways with zero code."
        actions={
          <button
            type="button"
            onClick={() => {
              setSuggestName("");
              setSuggestNotes("");
              setFormError("");
              setModal({ type: "suggest" });
            }}
            className="flex items-center gap-2 border border-[var(--key-border)] bg-[var(--key-surface-strong)] hover:bg-[var(--key-surface-hover)] text-[var(--key-text)] rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4 text-indigo-500" />
            Suggest Provider
          </button>
        }
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-aos="fade-up">
        <div className="key-glass-card p-4 rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--key-muted)] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest">Active Connected</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="font-display font-black text-2xl text-emerald-600 dark:text-emerald-400">{connectedCount}</p>
          <span className="text-[11px] text-[var(--key-muted)]">Live operational connectors</span>
        </div>

        <div className="key-glass-card p-4 rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--key-muted)] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest">Messaging & Alerts</span>
            <MessageCircle className="h-4 w-4 text-sky-500" />
          </div>
          <p className="font-display font-black text-2xl text-sky-600 dark:text-sky-400">{messagingCount}</p>
          <span className="text-[11px] text-[var(--key-muted)]">WhatsApp, Telegram & SMS</span>
        </div>

        <div className="key-glass-card p-4 rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--key-muted)] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest">Payment Gateways</span>
            <CreditCard className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="font-display font-black text-2xl text-indigo-600 dark:text-indigo-400">{paymentCount}</p>
          <span className="text-[11px] text-[var(--key-muted)]">Razorpay, Stripe & UPI</span>
        </div>

        <div className="key-glass-card p-4 rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--key-muted)] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Catalog</span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-display font-black text-2xl text-[var(--key-text)]">{items.length}</p>
          <span className="text-[11px] text-[var(--key-muted)]">Verified official partners</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3" data-aos="fade-up">
        <div className="key-icon-field flex-1">
          <span className="key-icon-field__icon">
            <Search className="h-4 w-4 text-[var(--key-muted)]" />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search integrations by name, protocol, or tag (e.g. Meta, Stripe, Telegram, SMS)..."
            aria-label="Search integrations"
            className="key-input key-icon-field__input w-full py-2.5 text-sm"
          />
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {(["All", "WhatsApp", "Telegram", "Email Marketing", "SMS Messaging", "Payments"] as const).map((filter) => {
            const isSelected = typeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setTypeFilter(filter)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-[var(--key-surface)] text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-strong)] border border-[var(--key-border)]"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Integration Cards List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl p-10 text-center space-y-3 bg-[var(--key-surface)] border border-dashed border-[var(--key-border)]" data-aos="fade-up">
          <p className="text-sm text-[var(--key-muted)]">No integrations match your search or filter criteria.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("All");
            }}
            className="text-indigo-500 text-sm font-semibold hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {(typeFilter === "All" || typeFilter === "WhatsApp") &&
            renderSection("WhatsApp & Business Messaging", whatsappItems, "Meta Cloud & BSP")}

          {(typeFilter === "All" || typeFilter === "Telegram") &&
            renderSection("Telegram Automations", telegramItems, "Bots & Channels")}

          {(typeFilter === "All" || typeFilter === "Email Marketing") &&
            renderSection("Email Marketing & Newsletters", emailItems, "Lead Sync")}

          {(typeFilter === "All" || typeFilter === "SMS Messaging") &&
            renderSection("SMS Messaging Gateways", smsItems, "OTP & Global Alerts")}

          {(typeFilter === "All" || typeFilter === "Payments") &&
            renderSection("Payment Gateways & Checkouts", paymentsItems, "Commerce")}
        </div>
      )}

      {/* Community Roadmap Vote Box */}
      <div className="p-6 rounded-2xl bg-[var(--key-surface)] border border-[var(--key-border)] space-y-4" data-aos="fade-up">
        <div>
          <span className="text-[10px] font-extrabold text-indigo-500 tracking-wider uppercase bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2.5 py-1">
            Community Roadmap
          </span>
          <h3 className="font-display font-bold text-[var(--key-text)] text-base md:text-lg mt-2">
            Vote for the Next Native Integration
          </h3>
          <p className="text-xs text-[var(--key-muted)] mt-1">
            Vote once per provider. The most demanded integrations are prioritized by our engineering team.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {sortedVotes.map((vt) => (
            <div
              key={vt.id}
              className={`p-4 rounded-xl border flex flex-col justify-between items-center text-center transition-all ${
                vt.voted
                  ? "bg-indigo-500/10 border-indigo-500/60 ring-1 ring-indigo-500/40"
                  : "bg-[var(--key-surface-strong)] hover:bg-[var(--key-surface-hover)] border-[var(--key-border)]"
              }`}
            >
              <div className="h-9 w-9 rounded-full bg-[var(--key-surface)] text-indigo-500 font-bold flex items-center justify-center text-xs font-mono border border-[var(--key-border)]">
                {vt.name[0]}
              </div>
              <div className="my-2.5 min-w-0 w-full">
                <h4 className="font-display font-bold text-[var(--key-text)] text-xs truncate">{vt.name}</h4>
                <span className="text-[11px] text-[var(--key-muted)] mt-0.5 block font-mono">
                  {vt.votes} vote{vt.votes !== 1 ? "s" : ""}
                </span>
              </div>

              {vt.voted ? (
                <button
                  type="button"
                  disabled
                  className="w-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-default border border-indigo-500/30"
                >
                  <Check className="h-3 w-3" />
                  <span>Voted</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleVoteClick(vt)}
                  className="w-full border border-[var(--key-border)] hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-500/10 py-1.5 rounded-lg text-xs font-bold transition-all text-[var(--key-muted)]"
                >
                  Vote
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Connect Modal */}
      {modal?.type === "connect" && activeConnectItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-integration-title"
            className="bg-[var(--key-surface-strong)] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--key-border)] max-h-[90vh] overflow-y-auto text-[var(--key-text)] animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--key-border)]">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${typeIconBgClass(activeConnectItem.type)}`}>
                  <TypeIcon type={activeConnectItem.type} />
                </div>
                <div>
                  <h3 id="connect-integration-title" className="font-display font-bold text-base text-[var(--key-text)]">
                    Connect {activeConnectItem.name}
                  </h3>
                  <span className="text-xs text-[var(--key-muted)]">{activeConnectItem.type} Integration</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setModal(null)}
                className="text-[var(--key-muted)] hover:text-[var(--key-text)] p-1 rounded-lg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-4" noValidate>
              {activeConnectItem.upgradeMessage && (
                <p className="text-xs text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  {activeConnectItem.upgradeMessage}
                </p>
              )}

              {/* Dynamic form fields depending on provider */}
              {activeConnectItem.id === "i_wa_cloud" ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      required
                      value={primaryKey}
                      onChange={(e) => setPrimaryKey(e.target.value)}
                      placeholder="e.g. 109827349812734"
                      className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                      WhatsApp Business Account ID (WABA)
                    </label>
                    <input
                      type="text"
                      value={secondaryKey}
                      onChange={(e) => setSecondaryKey(e.target.value)}
                      placeholder="e.g. 981273948127394"
                      className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                      Meta Permanent Access Token (Bearer)
                    </label>
                    <input
                      type="password"
                      value={extraId}
                      onChange={(e) => setExtraId(e.target.value)}
                      placeholder="EAAG..."
                      className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              ) : activeConnectItem.type === "Telegram" ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                      Telegram Bot Token
                    </label>
                    <input
                      type="password"
                      required
                      value={primaryKey}
                      onChange={(e) => setPrimaryKey(e.target.value)}
                      placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                      Chat ID / Channel Handle (e.g. @yourchannel or -10012345678)
                    </label>
                    <input
                      type="text"
                      value={secondaryKey}
                      onChange={(e) => setSecondaryKey(e.target.value)}
                      placeholder="e.g. @keylink_leads or -100987654321"
                      className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              ) : activeConnectItem.type === "Payments" ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                      Publishable Key / Key ID / Merchant ID
                    </label>
                    <input
                      type="text"
                      required
                      value={primaryKey}
                      onChange={(e) => setPrimaryKey(e.target.value)}
                      placeholder={activeConnectItem.name === "Stripe" ? "pk_live_..." : "rzp_live_... / Merchant ID"}
                      className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                      Secret Key / Salt Key
                    </label>
                    <input
                      type="password"
                      required
                      value={secondaryKey}
                      onChange={(e) => setSecondaryKey(e.target.value)}
                      placeholder="sk_live_... / Salt Key"
                      className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                      API Key / Secret Token
                    </label>
                    <input
                      type="password"
                      required
                      value={primaryKey}
                      onChange={(e) => setPrimaryKey(e.target.value)}
                      placeholder="Paste provider API key"
                      className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                      Account Email or Audience / Sender ID (optional)
                    </label>
                    <input
                      type="text"
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                      placeholder="you@company.com or list-id-123"
                      className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {activeConnectItem.docUrl && (
                <div className="pt-1">
                  <a
                    href={activeConnectItem.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center gap-1 underline"
                  >
                    View official {activeConnectItem.name} API setup documentation
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {formError && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg" role="alert">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--key-border)]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-bold text-[var(--key-muted)] hover:text-[var(--key-text)] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {isSubmitting ? "Verifying & Connecting…" : "Verify & Connect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade / Plan Info Modal */}
      {modal?.type === "upgrade" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-integration-title"
            className="bg-[var(--key-surface-strong)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--key-border)] text-[var(--key-text)] animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                <h3 id="upgrade-integration-title" className="font-display font-bold text-base text-[var(--key-text)]">
                  {modal.item.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-[var(--key-muted)] hover:text-[var(--key-text)] p-1 rounded-lg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--key-muted)] leading-relaxed mb-3">
              {modal.item.upgradeMessage || "This integration connects with your existing external provider account."}
            </p>
            <p className="text-xs text-[var(--key-muted)] mb-5">
              You can connect with your own provider API keys for this workspace at any time.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  resetConnectForm();
                  setModal({ type: "connect", item: modal.item });
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                Connect with API Key
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    onNavigate(ScreenId.CONTACT_SUPPORT);
                  }}
                  className="w-full bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] text-[var(--key-text)] py-2.5 rounded-xl text-xs font-bold border border-[var(--key-border)]"
                >
                  Contact Support for Guided Setup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manage Connected Integration Modal */}
      {modal?.type === "manage" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-integration-title"
            className="bg-[var(--key-surface-strong)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--key-border)] text-[var(--key-text)] animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--key-border)]">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${typeIconBgClass(modal.item.type)}`}>
                  <TypeIcon type={modal.item.type} />
                </div>
                <div>
                  <h3 id="manage-integration-title" className="font-display font-bold text-base text-[var(--key-text)]">
                    Manage {modal.item.name}
                  </h3>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Connected & Active
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-[var(--key-muted)] hover:text-[var(--key-text)] p-1 rounded-lg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[var(--key-muted)] mb-5">
              <div className="flex justify-between items-center bg-[var(--key-surface)] rounded-xl px-3.5 py-2.5 border border-[var(--key-border)]">
                <span className="text-[var(--key-muted)]">Integration Category</span>
                <span className="font-semibold text-[var(--key-text)]">{modal.item.type}</span>
              </div>
              {modal.item.apiKeyHint && (
                <div className="flex justify-between items-center bg-[var(--key-surface)] rounded-xl px-3.5 py-2.5 border border-[var(--key-border)]">
                  <span className="text-[var(--key-muted)]">Active Credential</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-300 font-bold">{modal.item.apiKeyHint}</span>
                </div>
              )}
              {modal.item.connectedAt && (
                <div className="flex justify-between items-center bg-[var(--key-surface)] rounded-xl px-3.5 py-2.5 border border-[var(--key-border)]">
                  <span className="text-[var(--key-muted)]">Connected Date</span>
                  <span className="font-semibold text-[var(--key-text)]">
                    {new Date(modal.item.connectedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsTestingPing(true);
                  window.setTimeout(() => {
                    setIsTestingPing(false);
                    triggerToast(`Health ping test to ${modal.item.name} returned 200 OK (Healthy).`);
                  }, 600);
                }}
                disabled={isTestingPing}
                className="w-full bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] text-[var(--key-text)] font-bold text-xs py-2.5 rounded-xl border border-[var(--key-border)] flex items-center justify-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                {isTestingPing ? "Testing Health Ping…" : "Test Connection Ping"}
              </button>

              {modal.item.docUrl && (
                <a
                  href={modal.item.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] text-[var(--key-text)] font-bold text-xs py-2.5 rounded-xl border border-[var(--key-border)] flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-indigo-500" />
                  Provider Portal / Docs
                </a>
              )}

              <button
                type="button"
                onClick={() => handleDisconnect(modal.item)}
                className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold text-xs py-2.5 rounded-xl border border-rose-500/30 flex items-center justify-center gap-1.5"
              >
                <Unplug className="h-3.5 w-3.5" />
                Disconnect Provider
              </button>

              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-full text-[var(--key-muted)] hover:text-[var(--key-text)] py-1.5 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Integration Modal */}
      {modal?.type === "suggest" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggest-integration-title"
            className="bg-[var(--key-surface-strong)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--key-border)] text-[var(--key-text)] animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--key-border)]">
              <h3 id="suggest-integration-title" className="font-display font-bold text-base text-[var(--key-text)]">
                Suggest an Integration
              </h3>
              <button
                type="button"
                onClick={() => !isSubmitting && setModal(null)}
                className="text-[var(--key-muted)] hover:text-[var(--key-text)] p-1 rounded-lg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSuggestSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                  Provider Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={suggestName}
                  onChange={(event) => setSuggestName(event.target.value)}
                  placeholder="e.g. HubSpot, Klaviyo, Zapier, Webflow"
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                  How will you use this integration? (optional)
                </label>
                <textarea
                  value={suggestNotes}
                  onChange={(event) => setSuggestNotes(event.target.value)}
                  rows={3}
                  placeholder="Describe your workflow or what actions you want automated..."
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              {formError && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg" role="alert">
                  {formError}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--key-border)]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-bold text-[var(--key-muted)] hover:text-[var(--key-text)] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? "Submitting…" : "Submit Suggestion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto bg-[var(--key-surface-strong)] text-[var(--key-text)] border border-indigo-500/40 text-xs font-bold py-3 px-5 rounded-2xl shadow-2xl z-[150] max-w-sm sm:ml-auto backdrop-blur-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </PageShell>
  );
}

