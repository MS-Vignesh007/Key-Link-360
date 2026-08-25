import type { Contact, ContactFormFieldEntry } from "../types";

export type LeadFormFields = Record<string, string>;

export interface ParsedLeadContact {
  name: string;
  email: string;
  phone: string;
  formFields: ContactFormFieldEntry[];
  notes: string;
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function findFieldValue(fields: ContactFormFieldEntry[], matchers: string[]): string {
  for (const entry of fields) {
    const label = normalizeLabel(entry.label);
    if (matchers.some((matcher) => label === matcher || label.includes(matcher))) {
      if (entry.value.trim()) return entry.value.trim();
    }
  }
  return "";
}

/** Map any dynamic form payload into Contact name/email/phone + full field list. */
export function parseLeadFormFields(fields: LeadFormFields): ParsedLeadContact {
  const formFields: ContactFormFieldEntry[] = Object.entries(fields || {})
    .map(([label, value]) => ({
      label: String(label || "").trim() || "Field",
      value: String(value ?? "").trim()
    }))
    .filter((entry) => entry.label);

  const emailFromType =
    findFieldValue(formFields, ["email", "e mail", "e-mail"]) ||
    formFields.find((entry) => entry.value.includes("@"))?.value ||
    "";

  const name =
    findFieldValue(formFields, ["full name", "your name", "name", "first name"]) ||
    (emailFromType ? emailFromType.split("@")[0] : "") ||
    "Website Lead";

  const phone = findFieldValue(formFields, ["phone", "mobile", "whatsapp", "tel", "cell"]);

  const message = findFieldValue(formFields, [
    "message",
    "notes",
    "comment",
    "enquiry",
    "inquiry",
    "details"
  ]);

  const extraLines = formFields
    .filter((entry) => {
      const label = normalizeLabel(entry.label);
      if (["name", "full name", "your name", "email", "e mail", "phone", "mobile"].some((m) => label.includes(m))) {
        return false;
      }
      return Boolean(entry.value);
    })
    .map((entry) => `${entry.label}: ${entry.value}`);

  const notes = [message, ...extraLines].filter(Boolean).join("\n");

  return {
    name,
    email: emailFromType,
    phone,
    formFields,
    notes
  };
}

export function maskContactEmail(email: string): string {
  const [local = "", domain = "•••.com"] = email.split("@");
  const visible = local.slice(0, 1) || "•";
  return `${visible}••••@${domain || "•••.com"}`;
}

export function maskContactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `•••••• ${digits.slice(-4)}` : phone ? "••••••" : "—";
}

export function buildContactFromLead(input: {
  fields: LeadFormFields;
  source: string;
  tags?: string[];
  pageId?: string;
  pageTitle?: string;
  blockId?: string;
  blockLabel?: string;
  ownerUserId?: string;
  existingId?: string;
  sourceDomain?: string;
  templateId?: string;
  templateName?: string;
  pageSlug?: string;
}): Contact {
  const parsed = parseLeadFormFields(input.fields);
  const id = input.existingId || `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    name: parsed.name,
    email: parsed.email || `lead_${id}@unknown.local`,
    phone: parsed.phone || "",
    source: input.source,
    tags: input.tags?.length ? input.tags : ["Form Lead"],
    capturedAt: new Date().toISOString(),
    maskedEmail: maskContactEmail(parsed.email || `lead_${id}@unknown.local`),
    maskedPhone: maskContactPhone(parsed.phone || ""),
    marketingOptIn: true,
    formFields: parsed.formFields,
    notes: parsed.notes,
    pageId: input.pageId,
    pageTitle: input.pageTitle,
    blockId: input.blockId,
    blockLabel: input.blockLabel,
    ownerUserId: input.ownerUserId,
    sourceDomain: input.sourceDomain,
    templateId: input.templateId,
    templateName: input.templateName,
    pageSlug: input.pageSlug
  };
}
