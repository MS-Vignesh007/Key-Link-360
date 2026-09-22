import {
  AppNotification,
  BioPage,
  BioPageDraft,
  Contact,
  CustomDomain,
  QRCodeItem,
  ScreenId,
  TrackingPixel,
  WhatsAppCampaign
} from "../types";
import { CreateNotificationInput, createNotification } from "../storage/notificationStorage";

export interface WorkspaceAuditContext {
  pages: BioPage[];
  savedDrafts?: BioPageDraft[];
  contacts?: Contact[];
  domains?: CustomDomain[];
  whatsAppCampaigns?: WhatsAppCampaign[];
  qrCodes?: QRCodeItem[];
  pixels?: TrackingPixel[];
}

/**
 * Audits the real, current state of all workspaces and produces truthful,
 * strictly authentic notifications reflecting before build, after build, after published,
 * and pending/waiting/processing/delivered/canceled/missing activities.
 */
export function auditWorkspaceTruth(
  context: WorkspaceAuditContext,
  existingNotifications: AppNotification[] = []
): AppNotification[] {
  const safeContext = context || {};
  const pages = Array.isArray(safeContext.pages) ? safeContext.pages : [];
  const savedDrafts = Array.isArray(safeContext.savedDrafts) ? safeContext.savedDrafts : [];
  const contacts = Array.isArray(safeContext.contacts) ? safeContext.contacts : [];
  const domains = Array.isArray(safeContext.domains) ? safeContext.domains : [];
  const whatsAppCampaigns = Array.isArray(safeContext.whatsAppCampaigns) ? safeContext.whatsAppCampaigns : [];
  const qrCodes = Array.isArray(safeContext.qrCodes) ? safeContext.qrCodes : [];
  const pixels = Array.isArray(safeContext.pixels) ? safeContext.pixels : [];

  const safeExisting = Array.isArray(existingNotifications) ? existingNotifications : [];
  const existingMap = new Map<string, AppNotification>();
  for (const n of safeExisting) {
    if (n && n.id) {
      existingMap.set(n.id, n);
    }
  }

  const truthfulInputs: CreateNotificationInput[] = [];

  // 1. AFTER PUBLISHED: Live bio websites
  const livePages = pages.filter((p) => p.status === "Live" && !p.isUncommitted);
  for (const page of livePages) {
    const views = Number(page.views) || 0;
    truthfulInputs.push({
      id: `truth_live_${page.id}`,
      type: "page_published",
      status: "delivered",
      stage: "after_publish",
      title: `Website Live · ${page.title}`,
      message: `"${page.title}" is live on the web (${page.slug}) · Total delivered views: ${views.toLocaleString()}. Responsive layout active.`,
      targetScreen: ScreenId.BIO_PAGES,
      actionLabel: "Open Live Site",
      meta: { pageId: page.id, slug: page.slug }
    });
  }

  // 2. BEFORE BUILD / PENDING: Drafts saved & awaiting publication
  for (const draft of savedDrafts) {
    const pageId = draft.pageId;
    const page = pages.find((p) => p.id === pageId);
    const title = draft.data?.title || page?.title || "Untitled Page";
    const blockCount = draft.data?.blocks?.length ?? 0;

    truthfulInputs.push({
      id: `truth_draft_${draft.id || pageId}`,
      type: "draft_saved",
      status: "pending",
      stage: "before_build",
      title: `Draft Saved · Pending Publish`,
      message: `"${title}" has ${blockCount} block(s) saved in draft. Pending publication to go live on the public web.`,
      targetScreen: ScreenId.BIO_PAGES,
      actionLabel: "Edit & Publish",
      meta: { pageId, draftId: draft.id }
    });
  }

  // 3. BEFORE BUILD / MISSING: Pages missing blocks or empty
  const draftOrOrphanPages = pages.filter((p) => p.status === "Draft" || p.isUncommitted);
  for (const page of draftOrOrphanPages) {
    const hasDraft = savedDrafts.some((d) => d.pageId === page.id);
    if (!hasDraft) {
      truthfulInputs.push({
        id: `truth_missing_${page.id}`,
        type: "general",
        status: "missing",
        stage: "before_build",
        title: `Content Pending · ${page.title}`,
        message: `"${page.title}" is in draft status. Awaiting hero banner, blocks, and design customization.`,
        targetScreen: ScreenId.BIO_PAGES,
        actionLabel: "Build Page",
        meta: { pageId: page.id }
      });
    }
  }

  // 4. WORKSPACE: Custom Domains (waiting, completed, canceled)
  for (const domain of domains) {
    const statusLower = String(domain.status || "").toLowerCase();
    if (statusLower.includes("verif") || statusLower === "active") {
      truthfulInputs.push({
        id: `truth_domain_${domain.id}`,
        type: "domain_updated",
        status: "completed",
        stage: "workspace_activity",
        title: `Domain Verified & SSL Active`,
        message: `Custom domain "${domain.domain}" is verified and routing traffic with SSL encryption delivered.`,
        targetScreen: ScreenId.CUSTOM_DOMAINS,
        actionLabel: "Manage Domains",
        meta: { domainId: domain.id }
      });
    } else if (statusLower.includes("fail") || statusLower === "error") {
      truthfulInputs.push({
        id: `truth_domain_${domain.id}`,
        type: "domain_updated",
        status: "canceled",
        stage: "workspace_activity",
        title: `Domain Verification Canceled / Failed`,
        message: `"${domain.domain}" DNS lookup failed. Please update your DNS A-Record to point to 76.76.21.21.`,
        targetScreen: ScreenId.CUSTOM_DOMAINS,
        actionLabel: "Fix DNS",
        meta: { domainId: domain.id }
      });
    } else {
      truthfulInputs.push({
        id: `truth_domain_${domain.id}`,
        type: "domain_updated",
        status: "waiting",
        stage: "workspace_activity",
        title: `DNS Verification Waiting`,
        message: `"${domain.domain}" is waiting for DNS A-Record propagation to 76.76.21.21. Will verify automatically.`,
        targetScreen: ScreenId.CUSTOM_DOMAINS,
        actionLabel: "Check Status",
        meta: { domainId: domain.id }
      });
    }
  }

  // 5. AFTER PUBLISH: Captured Leads & Contacts (delivered & awaiting follow-up)
  const recentContacts = contacts.slice(0, 5);
  for (const contact of recentContacts) {
    truthfulInputs.push({
      id: `truth_contact_${contact.id}`,
      type: "contact_added",
      status: "delivered",
      stage: "after_publish",
      title: `Lead Captured · ${contact.name}`,
      message: `${contact.name} (${contact.maskedEmail || contact.email || "Lead"}) submitted a form. Awaiting sales/support follow-up.`,
      targetScreen: ScreenId.CONTACTS,
      actionLabel: "View Contact",
      meta: { contactId: contact.id }
    });
  }

  // 6. WORKSPACE: WhatsApp Campaigns (upcoming, processing, completed, canceled)
  for (const camp of whatsAppCampaigns.slice(0, 3)) {
    const campStatus = String(camp.status || "").toLowerCase();
    if (campStatus === "scheduled") {
      truthfulInputs.push({
        id: `truth_camp_${camp.id}`,
        type: "campaign_status",
        status: "upcoming",
        stage: "workspace_activity",
        title: `Campaign Scheduled · ${camp.name}`,
        message: `WhatsApp broadcast "${camp.name}" is scheduled for delivery. Audience target prepared.`,
        targetScreen: ScreenId.WHATSAPP,
        actionLabel: "View Campaign"
      });
    } else if (campStatus === "active") {
      truthfulInputs.push({
        id: `truth_camp_${camp.id}`,
        type: "campaign_status",
        status: "processing",
        stage: "workspace_activity",
        title: `Campaign Sending · ${camp.name}`,
        message: `WhatsApp broadcast "${camp.name}" is currently processing message deliveries.`,
        targetScreen: ScreenId.WHATSAPP
      });
    } else if (campStatus === "completed") {
      truthfulInputs.push({
        id: `truth_camp_${camp.id}`,
        type: "campaign_status",
        status: "completed",
        stage: "workspace_activity",
        title: `Campaign Completed · ${camp.name}`,
        message: `WhatsApp broadcast "${camp.name}" has finished delivery.`,
        targetScreen: ScreenId.WHATSAPP
      });
    }
  }

  // 7. WORKSPACE: Dynamic QR Codes
  for (const qr of qrCodes.slice(0, 2)) {
    truthfulInputs.push({
      id: `truth_qr_${qr.id}`,
      type: "qr_generated",
      status: "delivered",
      stage: "workspace_activity",
      title: `Dynamic QR Ready · ${qr.name}`,
      message: `"${qr.name}" dynamic QR code is active and scanning to ${qr.targetUrl || "destination"}.`,
      targetScreen: ScreenId.QR_CODES,
      actionLabel: "View QR Code"
    });
  }

  // 8. WORKSPACE: Tracking Pixels
  for (const px of pixels.slice(0, 2)) {
    const isPending = px.status && px.status.toLowerCase().includes("valid");
    truthfulInputs.push({
      id: `truth_pixel_${px.id}`,
      type: "pixel_added",
      status: isPending ? "awaiting" : "completed",
      stage: "workspace_activity",
      title: `Pixel ${isPending ? "Awaiting Validation" : "Active"} · ${px.name}`,
      message: `"${px.name}" (${px.type}) is ${isPending ? "awaiting first event trigger" : "recording analytics"}.`,
      targetScreen: ScreenId.PIXELS
    });
  }

  // Merge with existing user notifications preserving user actions (reads, dismissals)
  const auditedNotifications: AppNotification[] = [];
  const processedIds = new Set<string>();

  // Add all newly created or updated truthful items
  for (const input of truthfulInputs) {
    if (!input.id) continue;
    processedIds.add(input.id);
    const existing = existingMap.get(input.id);

    if (existing) {
      // Keep user's read state and original timestamp, but update dynamic message/status
      auditedNotifications.push({
        ...existing,
        status: input.status,
        stage: input.stage,
        title: input.title,
        message: input.message,
        actionLabel: input.actionLabel,
        meta: input.meta
      });
    } else {
      auditedNotifications.push(createNotification(input));
    }
  }

  // Also keep any interactive manual notifications created during the session
  for (const n of existingNotifications) {
    if (!processedIds.has(n.id)) {
      auditedNotifications.push(n);
    }
  }

  // Sort by createdAt descending
  return auditedNotifications.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeB - timeA;
  });
}
