import React, { useMemo, useState } from "react";
import { IntegrationItem, IntegrationVote, ScreenId } from "../types";
import {
  MessageSquare,
  Mail,
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
  Sparkles
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
  if (type === "Messaging") return <MessageSquare className="h-5 w-5" />;
  if (type === "Email Marketing") return <Mail className="h-5 w-5" />;
  return <CreditCard className="h-5 w-5" />;
}

function typeIconClass(type: IntegrationItem["type"]) {
  if (type === "Messaging") return "bg-emerald-50 text-emerald-600";
  if (type === "Email Marketing") return "bg-rose-50 text-rose-500";
  return "bg-blue-50 text-blue-600";
}

function statusBadgeClass(status: IntegrationItem["status"]) {
  if (status === "Connected") return "bg-emerald-100 text-emerald-800";
  if (status === "Coming Soon") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-500";
}

function statusLabel(status: IntegrationItem["status"]) {
  if (status === "Connected") return "Connected";
  return status;
}

function isValidApiKey(value: string) {
  const trimmed = value.trim();
  return trimmed.length >= 8 && /^[A-Za-z0-9_\-.]+$/.test(trimmed);
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
  const [apiKey, setApiKey] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestName, setSuggestName] = useState("");
  const [suggestNotes, setSuggestNotes] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
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

  const messaging = filteredItems.filter((i) => i.type === "Messaging");
  const email = filteredItems.filter((i) => i.type === "Email Marketing");
  const payments = filteredItems.filter((i) => i.type === "Payments");

  const sortedVotes = useMemo(
    () => [...votes].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name)),
    [votes]
  );

  const connectedCount = items.filter((i) => i.status === "Connected").length;
  const lockedCount = items.filter((i) => i.status === "Locked").length;

  const resetConnectForm = () => {
    setApiKey("");
    setAccountEmail("");
    setFormError("");
  };

  const openConnect = (item: IntegrationItem) => {
    resetConnectForm();
    setModal({ type: "connect", item });
  };

  const handleConnectSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!modal || modal.type !== "connect") return;

    setFormError("");
    if (!isValidApiKey(apiKey)) {
      setFormError("Enter a valid API key (at least 8 characters).");
      return;
    }
    if (accountEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail.trim())) {
      setFormError("Enter a valid account email or leave it blank.");
      return;
    }

    const item = modal.item;
    setIsSubmitting(true);
    window.setTimeout(() => {
      const hint = apiKey.trim().slice(-4);
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
      triggerToast(`"${item.name}" connected successfully.`);
    }, 400);
  };

  const handleDisconnect = (item: IntegrationItem) => {
    if (!window.confirm(`Disconnect ${item.name}? Form automations using this provider will stop.`)) {
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
        ? `You're on the waitlist for ${item.name}. We'll notify you when it's ready.`
        : `Removed from the ${item.name} waitlist.`
    );
  };

  const handleVoteClick = (vote: IntegrationVote) => {
    if (vote.voted) return;
    onVote(vote.id);
    triggerToast(`Voted for ${vote.name}. Thanks for helping prioritize the roadmap.`);
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

  const renderSection = (title: string, sectionItems: IntegrationItem[]) => {
    if (sectionItems.length === 0) return null;
    return (
      <div className="key-workspace--stack">
        <h3 className="font-display font-bold text-xs tracking-widest text-slate-400 uppercase">
          {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 key-workspace-grid">
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
        className={`bg-white border rounded-3xl key-workspace-panel key-workspace-panel--stack shadow-sm flex flex-col justify-between transition-all min-w-0 ${
          isComingSoon
            ? "border-dashed border-slate-200"
            : "border-slate-100 hover:border-indigo-100 hover:shadow-lg"
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${typeIconClass(item.type)}`}
              >
                <TypeIcon type={item.type} />
              </div>
              <div className="min-w-0">
                <h4 className="font-display font-bold text-[#0F172A] text-sm md:text-base leading-tight truncate">
                  {item.name}
                </h4>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {item.type}
                </span>
              </div>
            </div>

            <span
              className={`text-[9px] font-bold rounded px-2 py-0.5 uppercase tracking-wide shrink-0 ${statusBadgeClass(item.status)}`}
            >
              {statusLabel(item.status)}
            </span>
          </div>

          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{item.description}</p>

          {item.upgradeMessage && isLocked && (
            <p className="text-[11px] text-slate-400 font-medium flex items-start gap-1.5">
              <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{item.upgradeMessage}</span>
            </p>
          )}

          {isConnected && item.apiKeyHint && (
            <p className="text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
              API key {item.apiKeyHint}
              {item.connectedAt
                ? ` · Connected ${new Date(item.connectedAt).toLocaleDateString()}`
                : ""}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isComingSoon && (
            <button
              type="button"
              onClick={() => handleWaitlist(item)}
              className={`w-full font-bold text-xs md:text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                item.waitlisted
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {item.waitlisted ? (
                <>
                  <BellRing className="h-4 w-4" />
                  On waitlist
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Notify me
                </>
              )}
            </button>
          )}

          {isConnected && (
            <>
              {item.name === "WOO Chat" && (
                <a
                  href="https://woochat.esowolf.in/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#00b074] hover:bg-[#009663] text-white font-bold text-xs md:text-sm py-2.5 rounded-xl transition-all text-center shadow-sm flex items-center justify-center gap-1.5"
                >
                  Sign In to WOO Chat
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {item.name === "Interakt WhatsApp" && onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate(ScreenId.WHATSAPP)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  Open WhatsApp tools
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModal({ type: "manage", item })}
                  className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold text-xs py-2.5 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Manage
                </button>
                <button
                  type="button"
                  onClick={() => handleDisconnect(item)}
                  className="bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs py-2.5 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Unplug className="h-3.5 w-3.5" />
                  Disconnect
                </button>
              </div>
            </>
          )}

          {isLocked && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openConnect(item)}
                className="w-full bg-[#E0E7FF]/60 hover:bg-[#EEF2FF] text-[#4F46E5] font-bold text-xs md:text-sm py-2.5 rounded-xl transition-all"
              >
                Connect
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => setModal({ type: "upgrade", item })}
                  className="w-full bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs md:text-sm py-2.5 rounded-xl border border-slate-200 transition-all"
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
    <PageShell className="font-sans text-slate-800">
      <PageHeader
        title="Integrations"
        subtitle="Connect KEYLINK360 to the tools you already use. Bring your own account — your messages and subscribers stay on your provider."
        actions={
          <button
            type="button"
            onClick={() => {
              setSuggestName("");
              setSuggestNotes("");
              setFormError("");
              setModal({ type: "suggest" });
            }}
            className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Suggest integration
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="key-glass-card p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connected</p>
          <p className="font-display font-black text-2xl text-slate-900 mt-1">{connectedCount}</p>
        </div>
        <div className="key-glass-card p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</p>
          <p className="font-display font-black text-2xl text-slate-900 mt-1">{items.length}</p>
        </div>
        <div className="key-glass-card p-4 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Locked</p>
          <p className="font-display font-black text-2xl text-slate-900 mt-1">{lockedCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="key-icon-field flex-1">
          <span className="key-icon-field__icon">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search integrations..."
            aria-label="Search integrations"
            className="key-input key-icon-field__input w-full py-2"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
          aria-label="Filter by type"
          className="key-input px-3 py-2 font-medium"
        >
          <option value="All">All types</option>
          <option value="Messaging">Messaging</option>
          <option value="Email Marketing">Email Marketing</option>
          <option value="Payments">Payments</option>
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-4 text-center space-y-2">
          <p className="text-sm text-slate-500">No integrations match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("All");
            }}
            className="text-[#4F46E5] text-sm font-semibold hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {renderSection("Messaging", messaging)}
          {renderSection("Email Marketing", email)}
          {renderSection("Payments", payments)}
        </>
      )}

      <Workspace stack className="bg-slate-50 border border-slate-100 rounded-3xl">
        <div>
          <span className="text-[9px] font-extrabold text-indigo-600 tracking-widest uppercase bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">
            Vote for the next integration
          </span>
          <h3 className="font-display font-bold text-gray-950 text-base md:text-lg mt-3">
            Tell us what to build next
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            One vote per provider — the most-wanted ones move up the queue.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 key-workspace-grid">
          {sortedVotes.map((vt) => (
            <div
              key={vt.id}
              className={`bg-white border p-4 sm:p-8 rounded-2xl flex flex-col justify-between items-center text-center transition-all shadow-sm min-w-0 ${
                vt.voted
                  ? "border-[#4F46E5] ring-2 ring-indigo-50/50"
                  : "border-slate-150 hover:border-slate-300"
              }`}
            >
              <div className="h-10 w-10 bg-slate-50 text-slate-400 font-bold rounded-full flex items-center justify-center text-sm font-mono shadow-inner">
                {vt.name[0]}
              </div>
              <div className="my-3 min-w-0 w-full">
                <h4 className="font-display font-bold text-gray-900 text-sm truncate">{vt.name}</h4>
                <span className="text-xs text-slate-400 mt-1 block">
                  {vt.votes} vote{vt.votes !== 1 ? "s" : ""}
                </span>
              </div>

              {vt.voted ? (
                <button
                  type="button"
                  disabled
                  className="w-full bg-[#EEF2FF] text-[#4F46E5] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-default"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Voted</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleVoteClick(vt)}
                  className="w-full border border-slate-200 hover:border-[#4F46E5] hover:text-[#4F46E5] py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Vote
                </button>
              )}
            </div>
          ))}
        </div>
      </Workspace>

      {modal?.type === "connect" && activeConnectItem && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-integration-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="connect-integration-title" className="font-display font-black text-lg text-slate-900">
                Connect {activeConnectItem.name}
              </h3>
              <button
                type="button"
                onClick={() => !isSubmitting && setModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-6" noValidate>
              {activeConnectItem.upgradeMessage && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  {activeConnectItem.upgradeMessage}
                </p>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  API / Secret key
                </label>
                <input
                  type="password"
                  autoFocus
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Paste your provider API key"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Account email (optional)
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(event) => setAccountEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              {formError && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {formError}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setModal(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-70 text-white rounded-xl text-xs font-extrabold shadow-sm"
                >
                  {isSubmitting ? "Connecting…" : "Connect integration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal?.type === "upgrade" && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-integration-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h3 id="upgrade-integration-title" className="font-display font-black text-lg text-slate-900">
                  {modal.item.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              {modal.item.upgradeMessage ||
                "This integration is available on a paid Smart Marketing plan."}
            </p>
            <p className="text-xs text-slate-400 mb-5">
              You can still connect with your own provider API key for this workspace, or contact
              support about upgrading.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  resetConnectForm();
                  setModal({ type: "connect", item: modal.item });
                }}
                className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-2.5 rounded-xl text-xs font-extrabold"
              >
                Connect with API key
              </button>
              {onNavigate && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setModal(null);
                      onNavigate(ScreenId.CONTACT_SUPPORT);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-bold border border-slate-200"
                  >
                    Contact support
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModal(null);
                      onNavigate(ScreenId.ACCOUNT);
                    }}
                    className="w-full text-slate-500 hover:text-slate-700 py-2 text-xs font-semibold"
                  >
                    View account settings
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {modal?.type === "manage" && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-integration-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="manage-integration-title" className="font-display font-black text-lg text-slate-900">
                Manage {modal.item.name}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-600 mb-5">
              <div className="flex justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                <span className="text-slate-400 font-medium">Status</span>
                <span className="font-bold text-emerald-700">Connected</span>
              </div>
              <div className="flex justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                <span className="text-slate-400 font-medium">Type</span>
                <span className="font-semibold">{modal.item.type}</span>
              </div>
              {modal.item.apiKeyHint && (
                <div className="flex justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  <span className="text-slate-400 font-medium">API key</span>
                  <span className="font-mono text-xs">{modal.item.apiKeyHint}</span>
                </div>
              )}
              {modal.item.connectedAt && (
                <div className="flex justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  <span className="text-slate-400 font-medium">Connected</span>
                  <span className="font-semibold">
                    {new Date(modal.item.connectedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {modal.item.name === "WOO Chat" && (
                <a
                  href="https://woochat.esowolf.in/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#00b074] hover:bg-[#009663] text-white font-bold text-xs py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5"
                >
                  Open WOO Chat
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {modal.item.name === "Interakt WhatsApp" && onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    onNavigate(ScreenId.WHATSAPP);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl"
                >
                  Open WhatsApp tools
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDisconnect(modal.item)}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-2.5 rounded-xl border border-rose-100"
              >
                Disconnect
              </button>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-full text-slate-500 hover:text-slate-700 py-2 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === "suggest" && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggest-integration-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="suggest-integration-title" className="font-display font-black text-lg text-slate-900">
                Suggest an integration
              </h3>
              <button
                type="button"
                onClick={() => !isSubmitting && setModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSuggestSubmit} className="space-y-6" noValidate>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Provider name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={suggestName}
                  onChange={(event) => setSuggestName(event.target.value)}
                  placeholder="e.g. HubSpot, Klaviyo, Zapier"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Why do you need it? (optional)
                </label>
                <textarea
                  value={suggestNotes}
                  onChange={(event) => setSuggestNotes(event.target.value)}
                  rows={3}
                  placeholder="Tell us how you'd use this integration..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>
              {formError && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {formError}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setModal(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-70 text-white rounded-xl text-xs font-extrabold shadow-sm"
                >
                  {isSubmitting ? "Submitting…" : "Submit suggestion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto bg-slate-900 text-white border border-slate-800 text-xs font-black py-3 px-5 rounded-2xl shadow-2xl z-50 max-w-sm sm:ml-auto">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
