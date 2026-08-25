import React, { useMemo, useRef, useState } from "react";
import { ScreenId, UserProfile } from "../types";
import {
  MessageSquare,
  Send,
  CheckCircle,
  ShieldCheck,
  X,
  Search,
  Clock,
  Paperclip,
  BookOpen,
  Trash2
} from "lucide-react";
import PageShell, { PageHeader } from "./layout/PageShell";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  message: string;
  email: string;
  status: "Submitted" | "In Progress" | "Resolved" | "Closed";
  createdAt: string;
  attachments: string[];
}

interface ContactSupportScreenProps {
  user?: UserProfile;
  onNavigate?: (screen: ScreenId) => void;
}

const SUPPORT_TICKETS_STORAGE_KEY = "keylink360_support_tickets";
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "t1",
    subject: "Custom domain connection fail",
    category: "Technical Issue",
    message:
      "My A Record propagates correctly but the dashboard still shows pending authorization.",
    email: "esoscalesoft@gmail.com",
    status: "In Progress",
    createdAt: "2026-03-28 14:22",
    attachments: []
  },
  {
    id: "t2",
    subject: "WhatsApp webhook configuration",
    category: "Strategic Integration",
    message: "Requesting higher throughput webhook limits for international event campaigns.",
    email: "esoscalesoft@gmail.com",
    status: "Submitted",
    createdAt: "2026-03-29 09:10",
    attachments: []
  }
];

const CATEGORIES = [
  "Technical Issue",
  "Billing Question",
  "Feature Request",
  "Strategic Integration"
] as const;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function statusClass(status: Ticket["status"]) {
  if (status === "In Progress") return "text-amber-600 bg-amber-50";
  if (status === "Resolved") return "text-emerald-600 bg-emerald-50";
  if (status === "Closed") return "text-slate-500 bg-slate-100";
  return "text-indigo-600 bg-indigo-50";
}

function loadTickets(): Ticket[] {
  try {
    const saved = localStorage.getItem(SUPPORT_TICKETS_STORAGE_KEY) || localStorage.getItem("keyslink_support_tickets");
    const parsed = saved ? JSON.parse(saved) : null;
    if (!Array.isArray(parsed)) return INITIAL_TICKETS;
    return parsed.map((ticket) => ({
      id: String(ticket.id || `t_${Date.now()}`),
      subject: String(ticket.subject || "Untitled"),
      category: String(ticket.category || "Technical Issue"),
      message: String(ticket.message || ""),
      email: String(ticket.email || ""),
      status: (["Submitted", "In Progress", "Resolved", "Closed"].includes(ticket.status)
        ? ticket.status
        : "Submitted") as Ticket["status"],
      createdAt: String(ticket.createdAt || ""),
      attachments: Array.isArray(ticket.attachments) ? ticket.attachments.map(String) : []
    }));
  } catch {
    return INITIAL_TICKETS;
  }
}

export default function ContactSupportScreen({ user, onNavigate }: ContactSupportScreenProps) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [formError, setFormError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>(() => loadTickets());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Ticket["status"]>("All");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const persistTickets = (nextTickets: Ticket[]) => {
    setTickets(nextTickets);
    try {
      localStorage.setItem(SUPPORT_TICKETS_STORAGE_KEY, JSON.stringify(nextTickets));
    } catch {
      triggerToast("Ticket saved for this session, but browser storage is full.");
    }
  };

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
      const matchesSearch =
        !query ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.message.toLowerCase().includes(query) ||
        ticket.category.toLowerCase().includes(query) ||
        ticket.id.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [tickets, searchQuery, statusFilter]);

  const openCount = tickets.filter(
    (ticket) => ticket.status === "Submitted" || ticket.status === "In Progress"
  ).length;

  const resetForm = () => {
    setSubject("");
    setMessage("");
    setCategory(CATEGORIES[0]);
    setEmail(user?.email || "");
    setAttachments([]);
    setFormError("");
    setAttachmentError("");
  };

  const addAttachments = (files: FileList | null) => {
    if (!files) return;
    setAttachmentError("");

    const incoming = Array.from(files);
    const rejected = incoming.find(
      (file) =>
        file.size > MAX_ATTACHMENT_BYTES ||
        !(
          file.type.startsWith("image/") ||
          file.type === "application/pdf" ||
          file.type === "text/plain" ||
          /\.(pdf|txt|log|png|jpe?g|gif|webp)$/i.test(file.name)
        )
    );

    if (rejected) {
      if (rejected.size > MAX_ATTACHMENT_BYTES) {
        setAttachmentError(`"${rejected.name}" exceeds the 5MB limit.`);
      } else {
        setAttachmentError(`"${rejected.name}" is not a supported file type.`);
      }
      return;
    }

    setAttachments((current) => {
      const uniqueFiles = [...current, ...incoming].filter(
        (file, index, all) =>
          all.findIndex(
            (candidate) => candidate.name === file.name && candidate.size === file.size
          ) === index
      );
      if (uniqueFiles.length > MAX_ATTACHMENTS) {
        setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      }
      return uniqueFiles.slice(0, MAX_ATTACHMENTS);
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    const trimmedEmail = email.trim();

    if (!trimmedSubject) {
      setFormError("Subject is required.");
      return;
    }
    if (trimmedSubject.length < 4) {
      setFormError("Subject must be at least 4 characters.");
      return;
    }
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setFormError("Enter a valid contact email.");
      return;
    }
    if (!trimmedMessage) {
      setFormError("Please describe your issue.");
      return;
    }
    if (trimmedMessage.length < 20) {
      setFormError("Please provide a bit more detail (at least 20 characters).");
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      const newTicket: Ticket = {
        id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        subject: trimmedSubject,
        category,
        message: trimmedMessage,
        email: trimmedEmail,
        status: "Submitted",
        createdAt: new Date().toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric"
        }),
        attachments: attachments.map((file) => file.name)
      };

      persistTickets([newTicket, ...tickets]);
      resetForm();
      setIsSubmitting(false);
      setSuccessTicketId(newTicket.id);
      triggerToast("Ticket submitted successfully.");
      window.setTimeout(() => setSuccessTicketId(null), 5000);
    }, 450);
  };

  const updateTicketStatus = (ticket: Ticket, status: Ticket["status"]) => {
    const updated = { ...ticket, status };
    persistTickets(tickets.map((item) => (item.id === ticket.id ? updated : item)));
    setSelectedTicket(updated);
    triggerToast(`Ticket marked as ${status}.`);
  };

  const deleteTicket = (ticket: Ticket) => {
    if (!window.confirm(`Delete ticket "${ticket.subject}"?`)) return;
    persistTickets(tickets.filter((item) => item.id !== ticket.id));
    if (selectedTicket?.id === ticket.id) setSelectedTicket(null);
    triggerToast("Ticket deleted.");
  };

  return (
    <PageShell className="max-w-5xl">
      <PageHeader
        title="Support Center"
        subtitle="Submit tickets directly to our developer team."
        actions={
          onNavigate ? (
            <button
              type="button"
              onClick={() => onNavigate(ScreenId.HELP_CENTER)}
              className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
            >
              <BookOpen className="h-4 w-4" />
              Help Center
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-[#0F172A] text-white rounded-3xl p-4 sm:p-6 md:p-5 shadow-2xl border border-slate-800 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-44 w-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <h3 className="font-display font-bold text-xl tracking-tight text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#FF6B4A]" />
              Contact Support
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Need personalized assistance? Complete the ticket details below.
            </p>
          </div>

          {successTicketId && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-semibold flex items-start gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Ticket submitted successfully! Reference{" "}
                <span className="font-mono">{successTicketId}</span>. We will follow up via email
                within 2 hours.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Ticket category
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Contact email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Subject
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Domain pending propagation"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Detailed explanation
              </label>
              <textarea
                required
                rows={5}
                placeholder="Briefly state the steps to reproduce or custom values..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Screenshots / documents
              </label>
              <input
                ref={attachmentInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,.pdf,.txt,.log"
                onChange={(event) => {
                  addAttachments(event.target.files);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  addAttachments(event.dataTransfer.files);
                }}
                className={`w-full border border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-indigo-400 bg-indigo-500/10"
                    : "border-slate-800 bg-slate-950/40 hover:border-slate-600"
                }`}
              >
                <span className="text-slate-500 text-[11px] flex items-center justify-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  {attachments.length
                    ? `${attachments.length} file${attachments.length === 1 ? "" : "s"} attached`
                    : "Drag files here or click to attach (images, PDF, TXT, LOG · max 5MB each)"}
                </span>
              </button>
              {attachmentError && (
                <p className="mt-2 text-xs font-medium text-rose-300" role="alert">
                  {attachmentError}
                </p>
              )}
              {attachments.length > 0 && (
                <ul className="mt-2 space-y-1" aria-label="Attached files">
                  {attachments.map((file) => (
                    <li
                      key={`${file.name}-${file.size}`}
                      className="flex items-center justify-between gap-3 text-[11px] text-slate-400"
                    >
                      <span className="truncate">
                        {file.name}{" "}
                        <span className="text-slate-600">
                          ({Math.max(1, Math.round(file.size / 1024))} KB)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setAttachments((current) =>
                            current.filter((candidate) => candidate !== file)
                          )
                        }
                        className="shrink-0 text-rose-300 hover:text-rose-200"
                        aria-label={`Remove ${file.name}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {formError && (
              <p className="text-xs font-medium text-rose-300" role="alert">
                {formError}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={resetForm}
                className="sm:w-auto px-4 py-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900 disabled:opacity-60"
              >
                Clear form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-70 disabled:cursor-not-allowed text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-indigo-950/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Submitting…" : "Submit Ticket"}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-gray-950 text-base">Your Active Tickets</h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                {openCount} open
              </span>
            </div>

            {tickets.length > 0 && (
              <div className="space-y-2">
                <div className="key-icon-field">
                  <span className="key-icon-field__icon">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search tickets..."
                    aria-label="Search tickets"
                    className="key-icon-field__input w-full bg-slate-50 border border-slate-200 rounded-xl py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as typeof statusFilter)
                  }
                  aria-label="Filter tickets by status"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                >
                  <option value="All">All statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            )}

            <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
              {tickets.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-xs text-slate-500">No tickets yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Submit a request and it will appear here.
                  </p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-slate-500">No tickets match your filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("All");
                    }}
                    className="text-[#4F46E5] text-xs font-semibold hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full text-left border border-gray-100 rounded-2xl p-4 space-y-2 hover:border-indigo-100 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">
                        {ticket.category}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClass(ticket.status)}`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <h4 className="font-sans font-bold text-gray-900 text-xs leading-snug">
                      {ticket.subject}
                    </h4>
                    <p className="text-gray-400 text-[11px] line-clamp-2">{ticket.message}</p>
                    {ticket.attachments.length > 0 && (
                      <p className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {ticket.attachments.length} attachment
                        {ticket.attachments.length === 1 ? "" : "s"}
                      </p>
                    )}
                    <span className="text-[10px] text-gray-400 font-mono block pt-1.5 border-t border-gray-50">
                      Created {ticket.createdAt}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#FF6B4A]/5 border border-[#FF6B4A]/10 rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
            <h4 className="font-display font-bold text-[#FF6B4A] text-sm flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5" />
              SLA Priority Included
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your workspace is tracked under Standard Priority Developer Support with answers
              targeted within 2 hours during business days.
            </p>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-detail-title"
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 sticky top-0 bg-white">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">
                    {selectedTicket.category}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClass(selectedTicket.status)}`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
                <h3
                  id="ticket-detail-title"
                  className="font-display font-bold text-lg text-slate-900 leading-snug"
                >
                  {selectedTicket.subject}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  {selectedTicket.id} · Created {selectedTicket.createdAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full shrink-0"
                aria-label="Close ticket"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-slate-400 font-medium">Contact</span>
                  <span className="font-semibold text-slate-700 break-all text-right">
                    {selectedTicket.email || "—"}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>We typically reply within 2 hours on business days.</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Message
                </p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </p>
              </div>

              {selectedTicket.attachments.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Attachments
                  </p>
                  <ul className="space-y-1">
                    {selectedTicket.attachments.map((name) => (
                      <li
                        key={name}
                        className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex items-center gap-1.5"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {selectedTicket.status !== "Resolved" && selectedTicket.status !== "Closed" && (
                  <button
                    type="button"
                    onClick={() => updateTicketStatus(selectedTicket, "Resolved")}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"
                  >
                    Mark resolved
                  </button>
                )}
                {selectedTicket.status !== "Closed" && (
                  <button
                    type="button"
                    onClick={() => updateTicketStatus(selectedTicket, "Closed")}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200"
                  >
                    Close ticket
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteTicket(selectedTicket)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
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
