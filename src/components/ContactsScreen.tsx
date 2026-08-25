import React, { useEffect, useMemo, useState } from "react";
import { Contact } from "../types";
import {
  Download,
  Plus,
  Search,
  ChevronDown,
  X,
  Tag,
  Pencil,
  Trash2,
  Users,
  Eye
} from "lucide-react";
import PageShell, { PageHeader, SectionCard, StatCard, StatCardGrid, Workspace } from "./layout/PageShell";

type ContactInput = Omit<Contact, "id" | "maskedEmail" | "maskedPhone">;

interface ContactsScreenProps {
  contacts: Contact[];
  onAddContact: (contact: ContactInput) => void;
  onUpdateContact: (id: string, contact: ContactInput) => void;
  onDeleteContact: (id: string) => void;
  onDeleteContacts?: (ids: string[]) => void;
}

interface SubmissionSheetRow {
  field: string;
  value: string;
}

function formatCapturedAt(value: string): string {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }
  return value;
}

function parseCapturedTime(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Build Excel-style Field | Value rows from every form entry + core contact data. */
function buildSubmissionSheetRows(contact: Contact): SubmissionSheetRow[] {
  const rows: SubmissionSheetRow[] = [];
  const seen = new Set<string>();

  const push = (field: string, value: string | undefined | null) => {
    const label = (field || "").trim();
    if (!label) return;
    const key = label.toLowerCase();
    const text = value == null ? "" : String(value).trim();
    if (seen.has(key)) {
      const existing = rows.find((row) => row.field.toLowerCase() === key);
      if (existing && !existing.value && text) existing.value = text;
      return;
    }
    seen.add(key);
    rows.push({ field: label, value: text || "—" });
  };

  for (const entry of contact.formFields || []) {
    push(entry.label, entry.value);
  }

  const hasMatcher = (...matchers: string[]) =>
    rows.some((row) => matchers.some((m) => row.field.toLowerCase().includes(m)));

  // Ensure core identity columns always appear even if formFields omitted them.
  if (!hasMatcher("name", "full name")) push("Full name", contact.name);
  if (!hasMatcher("email", "e-mail")) push("Email", contact.email);
  if (!hasMatcher("phone", "mobile", "whatsapp", "tel")) push("Phone", contact.phone);

  // Legacy notes often store extra custom fields as "Label: value" lines.
  if (contact.notes?.trim()) {
    const noteLines = contact.notes
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const leftover: string[] = [];
    for (const line of noteLines) {
      const match = line.match(/^([^:]{1,80}):\s*(.+)$/);
      if (match) {
        push(match[1].trim(), match[2].trim());
      } else {
        leftover.push(line);
      }
    }
    if (leftover.length) {
      push("Notes", leftover.join("\n"));
    }
  }

  push("Source", contact.source);
  if (contact.sourceDomain) push("Origin / Domain", contact.sourceDomain);
  if (contact.pageTitle) push("Bio page", contact.pageTitle);
  if (contact.blockLabel) push("Form block", contact.blockLabel);
  if (contact.templateName) push("Template", contact.templateName);
  if (contact.pageSlug) push("Page slug", contact.pageSlug);
  push("Captured", formatCapturedAt(contact.capturedAt));
  push("Marketing opt-in", contact.marketingOptIn ? "Yes" : "No");

  return rows;
}

function emptyForm() {
  return {
    name: "",
    email: "",
    phone: "",
    tag: "",
    marketingOptIn: true
  };
}

function contactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function sourceTone(source: string): string {
  const key = source.toUpperCase();
  if (key.includes("SMART")) return "key-contact-source--smart";
  if (key.includes("MANUAL")) return "key-contact-source--manual";
  if (key.includes("BIO") || key.includes("FORM")) return "key-contact-source--bio";
  return "key-contact-source--default";
}

function visibleTags(contact: Contact): string[] {
  return (contact.tags || []).filter((tag) => {
    const lower = tag.toLowerCase();
    if (lower.startsWith("domain:")) return false;
    if (lower.startsWith("template:")) return false;
    return true;
  });
}

export default function ContactsScreen({
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onDeleteContacts
}: ContactsScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All sources");
  const [tagFilter, setTagFilter] = useState("All tags");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  /** Row checkboxes / Select all only appear after user opens Delete. */
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    if (!isModalOpen && !detailContact) return;
    document.body.classList.add("key-contact-modal-open");
    return () => document.body.classList.remove("key-contact-modal-open");
  }, [isModalOpen, detailContact]);

  const triggerToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  };

  const sourceOptions = useMemo(() => {
    const sources = Array.from(new Set(contacts.map((contact) => contact.source).filter(Boolean))).sort();
    return ["All sources", ...sources];
  }, [contacts]);

  const tagOptions = useMemo(() => {
    const tags = Array.from(new Set(contacts.flatMap((contact) => contact.tags))).sort();
    return ["All tags", ...tags];
  }, [contacts]);

  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDays = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDays = now - 30 * 24 * 60 * 60 * 1000;

    return {
      total: contacts.length,
      last7: contacts.filter((contact) => parseCapturedTime(contact.capturedAt) >= sevenDays).length,
      last30: contacts.filter((contact) => parseCapturedTime(contact.capturedAt) >= thirtyDays).length,
      optIns: contacts.filter((contact) => contact.marketingOptIn).length
    };
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return contacts.filter((contact) => {
      const formBlob = [
        contact.notes || "",
        contact.pageTitle || "",
        contact.blockLabel || "",
        contact.sourceDomain || "",
        contact.templateName || "",
        ...(contact.formFields || []).flatMap((field) => [field.label, field.value])
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.phone.toLowerCase().includes(query) ||
        contact.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        formBlob.includes(query);

      const matchesSource = sourceFilter === "All sources" || contact.source === sourceFilter;
      const matchesTag = tagFilter === "All tags" || contact.tags.includes(tagFilter);

      return matchesSearch && matchesSource && matchesTag;
    });
  }, [contacts, searchQuery, sourceFilter, tagFilter]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || sourceFilter !== "All sources" || tagFilter !== "All tags";

  const filteredIds = useMemo(() => filteredContacts.map((contact) => contact.id), [filteredContacts]);
  const selectedCount = selectedIds.length;
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
  const someFilteredSelected =
    filteredIds.some((id) => selectedIds.includes(id)) && !allFilteredSelected;

  useEffect(() => {
    const alive = new Set(contacts.map((contact) => contact.id));
    setSelectedIds((prev) => prev.filter((id) => alive.has(id)));
  }, [contacts]);

  useEffect(() => {
    if (!bulkMenuOpen) return;
    const onDocClick = () => setBulkMenuOpen(false);
    window.addEventListener("click", onDocClick);
    return () => window.removeEventListener("click", onDocClick);
  }, [bulkMenuOpen]);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]));
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
    setBulkMenuOpen(false);
  };

  const openDeleteMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectionMode(true);
    setBulkMenuOpen((open) => !open);
  };

  const deleteContactIds = (ids: string[], label: string) => {
    if (ids.length === 0) return;
    if (onDeleteContacts) {
      onDeleteContacts(ids);
    } else {
      ids.forEach((id) => onDeleteContact(id));
    }
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    setBulkMenuOpen(false);
    setSelectionMode(false);
    triggerToast(label);
  };

  const handleDeleteSelected = () => {
    if (selectedCount === 0) {
      triggerToast("Select at least one contact first.");
      return;
    }
    if (
      !window.confirm(
        `Delete ${selectedCount} selected contact${selectedCount === 1 ? "" : "s"}? This cannot be undone.`
      )
    ) {
      return;
    }
    deleteContactIds(
      selectedIds,
      `Deleted ${selectedCount} contact${selectedCount === 1 ? "" : "s"}.`
    );
  };

  const handleDeleteAllFiltered = () => {
    if (filteredIds.length === 0) {
      triggerToast("No contacts to delete.");
      return;
    }
    const scope = hasActiveFilters ? "matching" : "all";
    if (
      !window.confirm(
        `Delete ${filteredIds.length} ${scope} contact${filteredIds.length === 1 ? "" : "s"}? This cannot be undone.`
      )
    ) {
      return;
    }
    deleteContactIds(
      filteredIds,
      `Deleted ${filteredIds.length} contact${filteredIds.length === 1 ? "" : "s"}.`
    );
  };

  const handleDeleteAllContacts = () => {
    if (contacts.length === 0) {
      triggerToast("No contacts to delete.");
      return;
    }
    if (
      !window.confirm(
        `Delete ALL ${contacts.length} contacts? This cannot be undone.`
      )
    ) {
      return;
    }
    deleteContactIds(
      contacts.map((contact) => contact.id),
      `Deleted all ${contacts.length} contacts.`
    );
  };

  const openCreateModal = () => {
    setEditingContact(null);
    setForm(emptyForm());
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      tag: contact.tags[0] || "",
      marketingOptIn: !!contact.marketingOptIn
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingContact(null);
    setForm(emptyForm());
    setFormError("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const tag = form.tag.trim();

    if (!name) {
      setFormError("Full name is required.");
      return;
    }
    if (!email || !isValidEmail(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (!phone || phone.replace(/\D/g, "").length < 7) {
      setFormError("Enter a valid phone number.");
      return;
    }

    const duplicate = contacts.find(
      (contact) =>
        contact.email.toLowerCase() === email.toLowerCase() &&
        contact.id !== editingContact?.id
    );
    if (duplicate) {
      setFormError("A contact with this email already exists.");
      return;
    }

    setIsSaving(true);

    window.setTimeout(() => {
      const payload: ContactInput = {
        name,
        email,
        phone,
        source: editingContact?.source || "MANUAL ENTRY",
        tags: tag ? [tag] : editingContact?.tags?.length ? editingContact.tags : ["Manual Lead"],
        capturedAt: editingContact?.capturedAt || new Date().toISOString(),
        marketingOptIn: form.marketingOptIn,
        formFields: (() => {
          const coreLabels = new Set(["full name", "your name", "name", "email", "phone", "mobile", "tag"]);
          const existing = editingContact?.formFields || [];
          const preserved = existing.filter(
            (field) => !coreLabels.has(field.label.trim().toLowerCase())
          );
          return [
            { label: "Full name", value: name },
            { label: "Email", value: email },
            { label: "Phone", value: phone },
            ...preserved,
            ...(tag ? [{ label: "Tag", value: tag }] : [])
          ];
        })(),
        notes: editingContact?.notes,
        pageId: editingContact?.pageId,
        pageTitle: editingContact?.pageTitle,
        blockId: editingContact?.blockId,
        blockLabel: editingContact?.blockLabel || "Manual lead block",
        sourceDomain:
          editingContact?.sourceDomain ||
          (typeof window !== "undefined" ? window.location.hostname : ""),
        templateId: editingContact?.templateId,
        templateName: editingContact?.templateName,
        pageSlug: editingContact?.pageSlug
      };

      if (editingContact) {
        onUpdateContact(editingContact.id, payload);
        triggerToast(`Updated ${name}.`);
      } else {
        onAddContact(payload);
        triggerToast(`Added ${name} to contacts.`);
      }

      setIsSaving(false);
      setIsModalOpen(false);
      setEditingContact(null);
      setForm(emptyForm());
    }, 350);
  };

  const handleDelete = (contact: Contact) => {
    if (!window.confirm(`Delete "${contact.name}"? This cannot be undone.`)) return;
    onDeleteContact(contact.id);
    setSelectedIds((prev) => prev.filter((id) => id !== contact.id));
    triggerToast(`Deleted ${contact.name}.`);
  };

  const triggerExport = () => {
    const rows = filteredContacts.length > 0 ? filteredContacts : contacts;
    if (rows.length === 0) {
      triggerToast("No contacts to export.");
      return;
    }

    const headers = "Name,Email,Phone,Source,Tags,FormData,Page,Block,Domain,Template,CapturedAt,MarketingOptIn\n";
    const csv = rows
      .map((contact) =>
        [
          contact.name,
          contact.email,
          contact.phone,
          contact.source,
          contact.tags.join(";"),
          contact.formFields?.map((field) => `${field.label}=${field.value}`).join(" | ") ||
            contact.notes ||
            "",
          contact.pageTitle || "",
          contact.blockLabel || "",
          contact.sourceDomain || "",
          contact.templateName || "",
          formatCapturedAt(contact.capturedAt),
          contact.marketingOptIn ? "Yes" : "No"
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([headers + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "keylink360_contacts.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Exported ${rows.length} contact${rows.length === 1 ? "" : "s"}.`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSourceFilter("All sources");
    setTagFilter("All tags");
  };

  const detailSheetRows = detailContact ? buildSubmissionSheetRows(detailContact) : [];

  return (
    <PageShell>
      <PageHeader
        title="Contacts"
        subtitle="Bio page Form / Smart Form submissions appear here automatically"
        actions={
          <>
            <button
              type="button"
              onClick={triggerExport}
              className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors bg-white shadow-sm"
            >
              <Download className="h-4.5 w-4.5 text-gray-400" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md shadow-indigo-100 transition-all active:scale-95"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add Contact</span>
            </button>
          </>
        }
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="contact-modal-title" className="font-display font-bold text-lg text-gray-950">
                {editingContact ? "Edit Contact" : "Add New Contact"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-left">
                <span className="font-bold block text-center text-slate-700 uppercase tracking-widest font-mono text-[10px]">
                  {editingContact ? "Edit lead block" : "Manual lead block"}
                </span>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Full name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl py-2 px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Email address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl py-2 px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Phone number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 555-0199"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl py-2 px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tag (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Newsletter, VIP"
                    value={form.tag}
                    onChange={(e) => setForm((prev) => ({ ...prev, tag: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl py-2 px-3 text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={form.marketingOptIn}
                    onChange={(e) => setForm((prev) => ({ ...prev, marketingOptIn: e.target.checked }))}
                    className="rounded border-slate-300 accent-[#7c3aed]"
                  />
                  <span className="font-semibold">
                    Marketing opt-in (email / WhatsApp updates)
                  </span>
                </label>
              </div>

              {formError && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-70 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-violet-500/25 transition-colors"
              >
                {isSaving ? "Saving…" : editingContact ? "Save Changes" : "Save Lead"}
              </button>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="w-full px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl disabled:opacity-60"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      <StatCardGrid>
        <StatCard label="TOTAL" value={stats.total} sub="all-time" />
        <StatCard label="LAST 7 DAYS" value={stats.last7} sub="new contacts" />
        <StatCard label="LAST 30 DAYS" value={stats.last30} sub="new contacts" />
        <StatCard label="MARKETING OPT-INS" value={stats.optIns} sub="consented" />
      </StatCardGrid>

      <SectionCard className="key-contacts-panel flex flex-col overflow-hidden">
        <Workspace className="key-contacts-toolbar border-b border-slate-100 flex flex-col gap-3">
          <div className="key-icon-field w-full">
            <span className="key-icon-field__icon">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              placeholder="Search by name, email, phone, domain, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="key-icon-field__input w-full bg-slate-50 border border-slate-100 rounded-xl py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
              aria-label="Search contacts"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:items-center">
            <div className="relative flex-1 min-w-0">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none appearance-none pr-8 cursor-pointer shadow-sm hover:bg-gray-50"
                aria-label="Filter by source"
              >
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative flex-1 min-w-0">
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none appearance-none pr-8 cursor-pointer shadow-sm hover:bg-gray-50"
                aria-label="Filter by tag"
              >
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {contacts.length > 0 ? (
              <div className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  onClick={openDeleteMenu}
                  className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 border rounded-xl px-3.5 py-2.5 text-sm font-semibold shadow-sm ${
                    selectionMode
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={bulkMenuOpen}
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  <span>Delete</span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>
                {bulkMenuOpen && (
                  <div
                    role="menu"
                    className="key-contacts-bulk-menu absolute right-0 mt-1.5 z-20 min-w-[14rem] rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleDeleteSelected}
                      disabled={selectedCount === 0}
                      className="key-contacts-bulk-menu__item"
                    >
                      Delete selected ({selectedCount})
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleDeleteAllFiltered}
                      disabled={filteredIds.length === 0}
                      className="key-contacts-bulk-menu__item"
                    >
                      Delete {hasActiveFilters ? "matching" : "visible"} ({filteredIds.length})
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleDeleteAllContacts}
                      disabled={contacts.length === 0}
                      className="key-contacts-bulk-menu__item key-contacts-bulk-menu__item--danger"
                    >
                      Delete all contacts ({contacts.length})
                    </button>
                    {selectionMode && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={exitSelectionMode}
                        className="key-contacts-bulk-menu__item"
                      >
                        Cancel selection
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="sm:w-auto w-full shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                Clear filters
              </button>
            )}
          </div>

          {contacts.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {selectionMode ? (
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected;
                    }}
                    onChange={toggleSelectAllFiltered}
                    className="key-contact-checkbox"
                    aria-label="Select all visible contacts"
                  />
                  <span>
                    Select all
                    {hasActiveFilters ? " matching" : ""}
                    {selectedCount > 0 ? ` (${selectedCount})` : ""}
                  </span>
                </label>
              ) : (
                <span />
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {filteredContacts.length} record{filteredContacts.length === 1 ? "" : "s"}
                {hasActiveFilters ? " matched" : ""}
              </p>
            </div>
          )}
        </Workspace>

        {contacts.length === 0 ? (
          <Workspace>
            <div className="py-14 text-center">
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#4F46E5]">
                <Users className="h-5 w-5" />
              </div>
              <p className="font-display font-bold text-gray-900">No contacts yet</p>
              <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                Add your first lead manually, or capture contacts when public visitors submit Form / Smart Form blocks on your Bio Pages.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add Contact
              </button>
            </div>
          </Workspace>
        ) : filteredContacts.length === 0 ? (
          <Workspace>
            <div className="py-12 text-center text-gray-400 text-sm space-y-3">
              <p>No contacts match the selected filters.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-[#4F46E5] font-semibold hover:underline"
              >
                Clear filters
              </button>
            </div>
          </Workspace>
        ) : (
          <Workspace className="key-contacts-workspace !p-0 sm:!p-0">
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredContacts.map((contact) => {
                const tags = visibleTags(contact);
                const isSelected = selectedIds.includes(contact.id);
                return (
                  <article
                    key={contact.id}
                    className={`key-contact-card p-4 space-y-3${isSelected ? " key-contact-card--selected" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {selectionMode ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(contact.id)}
                          className="key-contact-checkbox mt-2.5"
                          aria-label={`Select ${contact.name}`}
                        />
                      ) : null}
                      <div className="key-contact-avatar" aria-hidden>
                        {contactInitials(contact.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display font-semibold text-slate-900 text-sm truncate">
                              {contact.name}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                              {contact.email}
                            </p>
                            <p className="text-xs text-slate-500 font-mono truncate">
                              {contact.phone}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDetailContact(contact)}
                              className="key-contact-icon-btn"
                              title="View record"
                              aria-label={`View ${contact.name}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(contact)}
                              className="key-contact-icon-btn key-contact-icon-btn--edit"
                              title="Edit contact"
                              aria-label={`Edit ${contact.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(contact)}
                              className="key-contact-icon-btn key-contact-icon-btn--danger"
                              title="Delete contact"
                              aria-label={`Delete ${contact.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="mt-2.5 w-full text-left"
                          onClick={() => setDetailContact(contact)}
                        >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`key-contact-source ${sourceTone(contact.source)}`}>
                            {contact.source}
                          </span>
                          {contact.marketingOptIn && (
                            <span className="key-contact-chip key-contact-chip--optin">Opt-in</span>
                          )}
                          {tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="key-contact-chip">
                              {tag}
                            </span>
                          ))}
                          {tags.length > 2 && (
                            <span className="key-contact-chip">+{tags.length - 2}</span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                          {contact.sourceDomain ? <span>{contact.sourceDomain}</span> : null}
                          {contact.templateName ? <span>{contact.templateName}</span> : null}
                          <span>{formatCapturedAt(contact.capturedAt)}</span>
                          {(contact.formFields?.length || 0) > 0 ? (
                            <span className="text-indigo-500 font-semibold">
                              {contact.formFields!.length} fields
                            </span>
                          ) : null}
                        </div>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="key-contacts-table">
                <thead>
                  <tr>
                    {selectionMode ? (
                      <th className="key-contacts-table__check">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someFilteredSelected;
                          }}
                          onChange={toggleSelectAllFiltered}
                          className="key-contact-checkbox"
                          aria-label="Select all visible contacts"
                        />
                      </th>
                    ) : null}
                    <th>Contact</th>
                    <th>Phone</th>
                    <th>Source</th>
                    <th>Origin</th>
                    <th>Tags</th>
                    <th>Captured</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => {
                    const tags = visibleTags(contact);
                    const isSelected = selectedIds.includes(contact.id);

                    return (
                      <tr
                        key={contact.id}
                        className={`key-contacts-table__row--clickable${
                          selectionMode && isSelected ? " key-contacts-table__row--selected" : ""
                        }`}
                        onClick={() => setDetailContact(contact)}
                      >
                        {selectionMode ? (
                          <td
                            className="key-contacts-table__check"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(contact.id)}
                              className="key-contact-checkbox"
                              aria-label={`Select ${contact.name}`}
                            />
                          </td>
                        ) : null}
                        <td>
                          <div className="key-contact-identity">
                            <div className="key-contact-avatar" aria-hidden>
                              {contactInitials(contact.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="key-contact-name">{contact.name}</p>
                              <p className="key-contact-email">{contact.email}</p>
                              {(contact.formFields?.length || 0) > 0 ? (
                                <p className="key-contact-fields-hint">
                                  {contact.formFields!.length} field
                                  {contact.formFields!.length === 1 ? "" : "s"} captured
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="key-contact-mono">{contact.phone || "—"}</span>
                        </td>
                        <td>
                          <span className={`key-contact-source ${sourceTone(contact.source)}`}>
                            {contact.source}
                          </span>
                        </td>
                        <td>
                          {contact.sourceDomain || contact.templateName || contact.pageTitle ? (
                            <div className="key-contact-origin">
                              {contact.sourceDomain ? (
                                <span className="key-contact-origin__domain">{contact.sourceDomain}</span>
                              ) : null}
                              {contact.templateName ? (
                                <span className="key-contact-origin__template">{contact.templateName}</span>
                              ) : contact.pageTitle ? (
                                <span className="key-contact-origin__template">{contact.pageTitle}</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="key-contact-empty">—</span>
                          )}
                        </td>
                        <td>
                          <div className="key-contact-tags">
                            {contact.marketingOptIn && (
                              <span className="key-contact-chip key-contact-chip--optin">Opt-in</span>
                            )}
                            {tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="key-contact-chip">
                                <Tag className="h-2.5 w-2.5" />
                                {tag}
                              </span>
                            ))}
                            {tags.length > 2 && (
                              <span className="key-contact-chip">+{tags.length - 2}</span>
                            )}
                            {tags.length === 0 && !contact.marketingOptIn && (
                              <span className="key-contact-empty">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="key-contact-date">{formatCapturedAt(contact.capturedAt)}</span>
                        </td>
                        <td>
                          <div className="key-contact-actions" onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setDetailContact(contact)}
                              className="key-contact-icon-btn"
                              title="View submission"
                              aria-label={`View ${contact.name} details`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(contact)}
                              className="key-contact-icon-btn key-contact-icon-btn--edit"
                              title="Edit"
                              aria-label={`Edit ${contact.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(contact)}
                              className="key-contact-icon-btn key-contact-icon-btn--danger"
                              title="Delete"
                              aria-label={`Delete ${contact.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Workspace>
        )}
      </SectionCard>

      {detailContact && (
        <div
          className="key-contact-detail-overlay fixed inset-0 z-[110] flex items-center justify-center p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDetailContact(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-detail-title"
            className="key-contact-detail-dialog key-contact-detail-dialog--sheet"
          >
            <div className="key-contact-detail-dialog__head">
              <div className="flex items-start gap-3 min-w-0">
                <div className="key-contact-avatar key-contact-avatar--lg" aria-hidden>
                  {contactInitials(detailContact.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">
                    Form submission sheet
                  </p>
                  <h3
                    id="contact-detail-title"
                    className="font-display text-xl font-black text-slate-900 truncate"
                  >
                    {detailContact.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 font-mono truncate">{detailContact.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailContact(null)}
                className="key-contact-icon-btn"
                aria-label="Close details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="key-contact-detail-dialog__body">
              <div className="key-contact-sheet-meta">
                <span className={`key-contact-source ${sourceTone(detailContact.source)}`}>
                  {detailContact.source}
                </span>
                {detailContact.sourceDomain ? (
                  <span className="key-contact-sheet-meta__item">{detailContact.sourceDomain}</span>
                ) : null}
                <span className="key-contact-sheet-meta__item">
                  {formatCapturedAt(detailContact.capturedAt)}
                </span>
                <span className="key-contact-sheet-meta__count">
                  {detailSheetRows.length} rows
                </span>
              </div>

              <div className="key-contact-sheet-wrap">
                <table className="key-contact-sheet-table">
                  <thead>
                    <tr>
                      <th scope="col">Field</th>
                      <th scope="col">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailSheetRows.map((row, index) => (
                      <tr key={`${detailContact.id}-sheet-${row.field}-${index}`}>
                        <th scope="row">{row.field}</th>
                        <td>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visibleTags(detailContact).length > 0 && (
                <div className="key-contact-tags pt-1">
                  {visibleTags(detailContact).map((tag) => (
                    <span key={tag} className="key-contact-chip">
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="key-contact-detail-dialog__foot">
              <button
                type="button"
                onClick={() => setDetailContact(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const contact = detailContact;
                  setDetailContact(null);
                  openEditModal(contact);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4338CA]"
              >
                <Pencil className="h-4 w-4" />
                Edit contact
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-800 text-sm font-bold">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
