export type LeadContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  tags: string[];
  capturedAt: string;
  maskedEmail: string;
  maskedPhone: string;
  marketingOptIn?: boolean;
  formFields?: Array<{ label: string; value: string }>;
  notes?: string;
  pageId?: string;
  pageTitle?: string;
  blockId?: string;
  blockLabel?: string;
  ownerUserId?: string;
  sourceDomain?: string;
  templateId?: string;
  templateName?: string;
  pageSlug?: string;
};

type LeadFields = Record<string, string>;

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function toEntries(fields: LeadFields): Array<{ label: string; value: string }> {
  return Object.entries(fields || {})
    .map(([label, value]) => ({
      label: String(label || "").trim() || "Field",
      value: value == null ? "" : String(value).trim()
    }))
    .filter((entry) => entry.label);
}

function findValue(entries: Array<{ label: string; value: string }>, matchers: string[]): string {
  for (const entry of entries) {
    const label = normalizeLabel(entry.label);
    if (matchers.some((matcher) => label === matcher || label.includes(matcher))) {
      if (entry.value.trim()) return entry.value.trim();
    }
  }
  return "";
}

function maskEmail(email: string): string {
  const [local = "", domain = "•••.com"] = email.split("@");
  return `${local.slice(0, 1) || "•"}••••@${domain || "•••.com"}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `•••••• ${digits.slice(-4)}` : phone ? "••••••" : "—";
}

export function buildLeadContact(input: {
  fields: LeadFields;
  source: string;
  pageId?: string;
  pageTitle?: string;
  blockId?: string;
  blockLabel?: string;
  ownerUserId?: string;
  sourceDomain?: string;
  templateId?: string;
  templateName?: string;
  pageSlug?: string;
  existing?: Partial<LeadContact> | null;
}): LeadContact {
  const formFields = toEntries(input.fields);
  const email =
    findValue(formFields, ["email", "e mail", "e-mail"]) ||
    formFields.find((entry) => entry.value.includes("@"))?.value ||
    "";
  const name =
    findValue(formFields, ["full name", "your name", "name", "first name"]) ||
    (email ? email.split("@")[0] : "") ||
    "Website Lead";
  const phone = findValue(formFields, ["phone", "mobile", "whatsapp", "tel", "cell"]);
  const message = findValue(formFields, ["message", "notes", "comment", "enquiry", "inquiry", "details"]);
  const extra = formFields
    .filter((entry) => {
      const label = normalizeLabel(entry.label);
      return !["name", "full name", "email", "phone", "mobile"].some((m) => label.includes(m)) && entry.value;
    })
    .map((entry) => `${entry.label}: ${entry.value}`);
  const notes = [message, ...extra].filter(Boolean).join("\n");
  const id = input.existing?.id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const resolvedEmail = email || input.existing?.email || `lead_${id}@unknown.local`;
  const sourceDomain = (input.sourceDomain || input.existing?.sourceDomain || "").trim();
  const templateName = (input.templateName || input.existing?.templateName || "").trim();
  const templateId = (input.templateId || input.existing?.templateId || "").trim();

  return {
    id,
    name,
    email: resolvedEmail,
    phone: phone || input.existing?.phone || "",
    source: input.source || "BIO FORM",
    tags: Array.from(
      new Set(
        [
          ...(input.existing?.tags || []),
          "Form Lead",
          input.blockLabel || "",
          sourceDomain ? `Domain:${sourceDomain}` : "",
          templateName ? `Template:${templateName}` : ""
        ].filter(Boolean)
      )
    ),
    capturedAt: input.existing?.capturedAt || new Date().toISOString(),
    maskedEmail: maskEmail(resolvedEmail),
    maskedPhone: maskPhone(phone || input.existing?.phone || ""),
    marketingOptIn: true,
    formFields,
    notes,
    pageId: input.pageId || input.existing?.pageId,
    pageTitle: input.pageTitle || input.existing?.pageTitle,
    blockId: input.blockId || input.existing?.blockId,
    blockLabel: input.blockLabel || input.existing?.blockLabel,
    ownerUserId: input.ownerUserId || input.existing?.ownerUserId,
    sourceDomain: sourceDomain || input.existing?.sourceDomain,
    templateId: templateId || input.existing?.templateId,
    templateName: templateName || input.existing?.templateName,
    pageSlug: input.pageSlug || input.existing?.pageSlug
  };
}

export function upsertOwnerContact(contacts: LeadContact[], contact: LeadContact): LeadContact[] {
  const list = Array.isArray(contacts) ? [...contacts] : [];
  const emailKey = contact.email.trim().toLowerCase();
  const index = list.findIndex(
    (row) =>
      row.ownerUserId === contact.ownerUserId &&
      row.email.trim().toLowerCase() === emailKey &&
      !emailKey.endsWith("@unknown.local")
  );

  if (index >= 0 && !emailKey.endsWith("@unknown.local")) {
    const mergedFields = mergeFormFieldLists(list[index].formFields, contact.formFields);
    list[index] = {
      ...list[index],
      ...contact,
      id: list[index].id,
      capturedAt: list[index].capturedAt,
      tags: Array.from(new Set([...(list[index].tags || []), ...(contact.tags || [])])),
      formFields: mergedFields.length ? mergedFields : list[index].formFields,
      notes:
        (contact.notes && contact.notes.length >= (list[index].notes || "").length
          ? contact.notes
          : list[index].notes || contact.notes) || "",
      pageId: contact.pageId || list[index].pageId,
      pageTitle: contact.pageTitle || list[index].pageTitle,
      blockId: contact.blockId || list[index].blockId,
      blockLabel: contact.blockLabel || list[index].blockLabel,
      sourceDomain: contact.sourceDomain || list[index].sourceDomain,
      templateId: contact.templateId || list[index].templateId,
      templateName: contact.templateName || list[index].templateName,
      pageSlug: contact.pageSlug || list[index].pageSlug
    };
    return list;
  }

  list.unshift(contact);
  return list;
}

function contactMergeKey(contact: LeadContact, ownerUserId?: string): string {
  const owner = contact.ownerUserId || ownerUserId || "local";
  const email = (contact.email || "").trim().toLowerCase();
  if (email && !email.endsWith("@unknown.local")) {
    return `email:${owner}:${email}`;
  }
  return `id:${contact.id}`;
}

function mergeFormFieldLists(
  a?: Array<{ label: string; value: string }>,
  b?: Array<{ label: string; value: string }>
): Array<{ label: string; value: string }> {
  const map = new Map<string, { label: string; value: string }>();
  for (const field of [...(a || []), ...(b || [])]) {
    if (!field || typeof field.label !== "string") continue;
    const key = field.label.trim().toLowerCase();
    if (!key) continue;
    const value = typeof field.value === "string" ? field.value : String(field.value ?? "");
    const prev = map.get(key);
    if (!prev || (value && (!prev.value || value.length >= prev.value.length))) {
      map.set(key, { label: field.label.trim() || prev?.label || key, value });
    }
  }
  return Array.from(map.values());
}

function pickRicherContact(a: LeadContact, b: LeadContact): LeadContact {
  const aFields = a.formFields?.length || 0;
  const bFields = b.formFields?.length || 0;
  const aTime = new Date(a.capturedAt || 0).getTime();
  const bTime = new Date(b.capturedAt || 0).getTime();
  const preferB = bFields > aFields || (bFields === aFields && bTime >= aTime);
  const primary = preferB ? b : a;
  const secondary = preferB ? a : b;
  return {
    ...secondary,
    ...primary,
    id: a.id || b.id,
    capturedAt: a.capturedAt || b.capturedAt,
    tags: Array.from(new Set([...(a.tags || []), ...(b.tags || [])].filter(Boolean))),
    formFields: mergeFormFieldLists(secondary.formFields, primary.formFields),
    notes:
      (primary.notes && primary.notes.length >= (secondary.notes || "").length
        ? primary.notes
        : secondary.notes || primary.notes) || "",
    pageId: primary.pageId || secondary.pageId,
    pageTitle: primary.pageTitle || secondary.pageTitle,
    blockId: primary.blockId || secondary.blockId,
    blockLabel: primary.blockLabel || secondary.blockLabel,
    ownerUserId: primary.ownerUserId || secondary.ownerUserId,
    sourceDomain: primary.sourceDomain || secondary.sourceDomain,
    templateId: primary.templateId || secondary.templateId,
    templateName: primary.templateName || secondary.templateName,
    pageSlug: primary.pageSlug || secondary.pageSlug
  };
}

/**
 * Merge workspace contacts without wiping public bio-form leads.
 * Keeps other owners' rows; unions the signed-in owner's server + client lists.
 */
export function mergeContactLists(
  existing: unknown,
  incoming: unknown,
  ownerUserId?: string
): LeadContact[] {
  const existingList = Array.isArray(existing) ? (existing as LeadContact[]) : [];
  const incomingList = Array.isArray(incoming) ? (incoming as LeadContact[]) : [];
  const others: LeadContact[] = [];
  const owned = new Map<string, LeadContact>();

  const considerOwned = (row: LeadContact) => {
    const stamped: LeadContact = {
      ...row,
      ownerUserId: row.ownerUserId || ownerUserId || "local"
    };
    const key = contactMergeKey(stamped, ownerUserId);
    const prev = owned.get(key);
    owned.set(key, prev ? pickRicherContact(prev, stamped) : stamped);
  };

  for (const row of existingList) {
    if (!row || typeof row !== "object" || !row.id) continue;
    const owner = row.ownerUserId;
    if (
      ownerUserId &&
      owner &&
      owner !== ownerUserId &&
      owner !== "local"
    ) {
      others.push(row);
      continue;
    }
    considerOwned(row);
  }

  for (const row of incomingList) {
    if (!row || typeof row !== "object" || !row.id) continue;
    considerOwned({
      ...row,
      ownerUserId: ownerUserId || row.ownerUserId || "local"
    });
  }

  return [...Array.from(owned.values()), ...others].sort(
    (a, b) => new Date(b.capturedAt || 0).getTime() - new Date(a.capturedAt || 0).getTime()
  );
}
