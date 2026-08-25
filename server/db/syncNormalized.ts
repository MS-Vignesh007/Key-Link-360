import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthStoreShape } from "../auth/crypto";
import { mergeContactLists } from "../leads";
import { mergeQrCodeLists } from "../qrCodes/repository";

const PAGE_META_KEYS = new Set([
  "auth",
  "pages_list",
  "bio_page_templates",
  "tracking_events",
  "contacts",
  "whatsapp_campaigns",
  "whatsapp_templates",
  "smart_links",
  "qr_codes",
  "catalog_templates",
  "integrations",
  "integration_votes",
  "tracking_pixels",
  "media_files",
  "custom_domains",
  "help_articles",
  "support_tickets",
  "publish_settings",
  "notifications",
  "bio_page_drafts"
]);

async function upsertChunks(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict = "id"
) {
  if (!rows.length) return;
  const size = 200;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

function mapAuth(store: AuthStoreShape) {
  const users = store.users.map((u) => ({
    id: u.id,
    email: u.email,
    password_hash: u.passwordHash,
    password_salt: u.passwordSalt,
    first_name: u.firstName,
    last_name: u.lastName,
    company_name: u.companyName,
    business_name: u.businessName,
    phone: u.phone,
    country: u.country,
    avatar_url: u.avatarUrl,
    plan: u.plan,
    is_verified: u.isVerified,
    email_verified: u.emailVerified,
    status: u.status,
    mfa_enabled: u.mfaEnabled,
    newsletter_opt_in: u.newsletterOptIn,
    failed_login_attempts: u.failedLoginAttempts,
    locked_until: u.lockedUntil,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
    last_login_at: u.lastLoginAt
  }));

  const sessions = store.sessions.map((s) => ({
    id: s.id,
    user_id: s.userId,
    refresh_token_hash: s.refreshTokenHash,
    remember_me: s.rememberMe,
    user_agent: s.userAgent,
    ip: s.ip,
    created_at: s.createdAt,
    expires_at: s.expiresAt,
    revoked_at: s.revokedAt
  }));

  const passwordResets = store.passwordResetTokens.map((r) => ({
    id: r.id,
    user_id: r.userId,
    email: r.email,
    otp_hash: r.otpHash,
    token_hash: r.tokenHash,
    attempts: r.attempts,
    created_at: r.createdAt,
    expires_at: r.expiresAt,
    used_at: r.usedAt
  }));

  const emailVerifications = store.emailVerificationTokens.map((r) => ({
    id: r.id,
    user_id: r.userId,
    email: r.email,
    token_hash: r.tokenHash,
    created_at: r.createdAt,
    expires_at: r.expiresAt,
    used_at: r.usedAt
  }));

  const oauthAccounts = store.oauthAccounts.map((o) => ({
    id: o.id,
    user_id: o.userId,
    provider: o.provider,
    provider_user_id: o.providerUserId,
    email: o.email,
    name: o.name,
    avatar_url: o.avatarUrl,
    created_at: o.createdAt
  }));

  const loginHistory = store.loginHistory.slice(0, 2000).map((h) => ({
    id: h.id,
    user_id: h.userId,
    email: h.email,
    success: h.success,
    reason: h.reason,
    ip: h.ip,
    user_agent: h.userAgent,
    created_at: h.createdAt
  }));

  const auditLogs = store.auditLogs.slice(0, 2000).map((a) => ({
    id: a.id,
    user_id: a.userId,
    action: a.action,
    meta: a.meta || {},
    created_at: a.createdAt
  }));

  const rateLimits = Object.entries(store.rateLimits || {}).map(([rate_key, v]) => ({
    rate_key,
    count: v.count,
    window_start: v.windowStart
  }));

  return {
    users,
    sessions,
    passwordResets,
    emailVerifications,
    oauthAccounts,
    loginHistory,
    auditLogs,
    rateLimits
  };
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

/** Push in-memory root JSON into normalized Supabase tables (all project fields). */
export async function syncRootToNormalizedTables(
  supabase: SupabaseClient,
  root: Record<string, unknown>
): Promise<{ ok: boolean; counts?: Record<string, number>; error?: string }> {
  try {
    const counts: Record<string, number> = {};

    if (root.auth && typeof root.auth === "object") {
      const mapped = mapAuth(root.auth as AuthStoreShape);
      await upsertChunks(supabase, "auth_users", mapped.users);
      await upsertChunks(supabase, "auth_sessions", mapped.sessions);
      await upsertChunks(supabase, "auth_password_resets", mapped.passwordResets);
      await upsertChunks(supabase, "auth_email_verifications", mapped.emailVerifications);
      await upsertChunks(supabase, "auth_oauth_accounts", mapped.oauthAccounts);
      await upsertChunks(supabase, "auth_login_history", mapped.loginHistory);
      await upsertChunks(supabase, "auth_audit_logs", mapped.auditLogs);
      await upsertChunks(supabase, "auth_rate_limits", mapped.rateLimits, "rate_key");
      counts.auth_users = mapped.users.length;
      counts.auth_sessions = mapped.sessions.length;
    }

    const pages = asArray(root.pages_list);
    if (pages.length) {
      await upsertChunks(
        supabase,
        "bio_pages",
        pages.map((p) => ({
          id: String(p.id),
          title: p.title || "",
          slug: p.slug || "",
          status: p.status || "Draft",
          views: Number(p.views) || 0,
          created_at: p.createdAt || null,
          bio: p.bio ?? null,
          cover_photo: p.coverPhoto ?? null,
          owner_user_id: p.ownerUserId ?? null,
          updated_at: new Date().toISOString()
        }))
      );
      counts.bio_pages = pages.length;
    }

    const docs: Record<string, unknown>[] = [];
    for (const [key, value] of Object.entries(root)) {
      if (PAGE_META_KEYS.has(key)) continue;
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const doc = value as { blocks?: unknown; details?: unknown; updatedAt?: string };
      if (!("blocks" in doc) && !("details" in doc)) continue;
      docs.push({
        page_id: key,
        blocks: doc.blocks ?? [],
        details: doc.details ?? {},
        updated_at: doc.updatedAt || new Date().toISOString()
      });
    }
    if (docs.length) {
      await upsertChunks(supabase, "bio_page_documents", docs, "page_id");
      counts.bio_page_documents = docs.length;
    }

    const templates = asArray(root.bio_page_templates);
    if (templates.length) {
      await upsertChunks(
        supabase,
        "bio_page_templates",
        templates.map((t) => ({
          id: String(t.id),
          name: t.name || "",
          source_page_id: t.sourcePageId ?? null,
          preview_image: t.previewImage ?? null,
          description: t.description ?? null,
          data: t.data || {},
          created_at: t.createdAt || new Date().toISOString(),
          updated_at: t.updatedAt || new Date().toISOString(),
          is_built_in: Boolean(t.isBuiltIn)
        }))
      );
      counts.bio_page_templates = templates.length;
    }

    const drafts = asArray(root.bio_page_drafts);
    if (drafts.length) {
      await upsertChunks(
        supabase,
        "bio_page_drafts",
        drafts.map((d) => ({
          id: String(d.id),
          page_id: d.pageId || "",
          page_slug: d.pageSlug ?? null,
          owner_user_id: d.ownerUserId ?? null,
          data: d.data || {},
          created_at: d.createdAt || new Date().toISOString(),
          updated_at: d.updatedAt || new Date().toISOString()
        }))
      );
      counts.bio_page_drafts = drafts.length;
    }

    const events = asArray(root.tracking_events).slice(0, 5000);
    if (events.length) {
      await upsertChunks(
        supabase,
        "tracking_events",
        events.map((e) => ({
          id: String(e.id),
          page_id: e.pageId || "unknown",
          event_type: e.eventType || "visit",
          event_label: e.eventLabel || "",
          device: e.device ?? null,
          os: e.os ?? null,
          browser: e.browser ?? null,
          domain: e.domain ?? null,
          port: e.port ?? null,
          details: e.details || {},
          created_at: e.timestamp || e.createdAt || new Date().toISOString()
        }))
      );
      counts.tracking_events = events.length;
    }

    // Workspace-style collections if already present on root
    const workspaceMaps: Array<{
      key: string;
      table: string;
      map: (row: any) => Record<string, unknown>;
    }> = [
      {
        key: "contacts",
        table: "contacts",
        map: (c) => ({
          id: String(c.id),
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          source: c.source || "",
          tags: c.tags || [],
          captured_at: c.capturedAt || null,
          masked_email: c.maskedEmail || "",
          masked_phone: c.maskedPhone || "",
          marketing_opt_in: c.marketingOptIn ?? null,
          owner_user_id: c.ownerUserId ?? null
        })
      },
      {
        key: "whatsapp_campaigns",
        table: "whatsapp_campaigns",
        map: (c) => ({
          id: String(c.id),
          name: c.name || "",
          status: c.status || "Draft",
          recipients: c.recipients || "",
          open_rate: c.openRate || "",
          template_id: c.templateId ?? null,
          created_at: c.createdAt || null
        })
      },
      {
        key: "whatsapp_templates",
        table: "whatsapp_templates",
        map: (t) => ({
          id: String(t.id),
          name: t.name || "",
          status: t.status || "Pending",
          body: t.body ?? null,
          created_at: t.createdAt || null
        })
      },
      {
        key: "smart_links",
        table: "smart_links",
        map: (l) => ({
          id: String(l.id),
          title: l.title || "",
          slug: l.slug || "",
          short_url: l.shortUrl || "",
          destination_url: l.destinationUrl ?? null,
          status: l.status || "Live",
          clicks: Number(l.clicks) || 0,
          retargeting: l.retargeting || []
        })
      },
      {
        key: "qr_codes",
        table: "qr_codes",
        map: (q) => ({
          id: String(q.id),
          name: q.name || "",
          status: q.status || "Active",
          scans: q.scans || "0",
          unique_scanners: q.uniqueScanners || "0",
          top_location: q.topLocation ?? null,
          conversion_rate: q.conversionRate ?? null,
          qr_url: q.qrUrl || "",
          target_url: q.targetUrl || "",
          public_code: q.publicCode || null,
          scan_url: q.scanUrl || null,
          custom_design: Boolean(q.customDesign),
          design_color: q.designColor ?? null,
          design_logo: q.designLogo ?? null,
          design_pattern: q.designPattern ?? null
        })
      },
      {
        key: "catalog_templates",
        table: "catalog_templates",
        map: (t) => ({
          id: String(t.id),
          name: t.name || "",
          category: t.category || "Marketing",
          widgets: Number(t.widgets) || 0,
          used_count: t.usedCount || "0",
          image_url: t.imageUrl || "",
          description: t.description || ""
        })
      },
      {
        key: "integrations",
        table: "integrations",
        map: (i) => ({
          id: String(i.id),
          name: i.name || "",
          type: i.type || "Messaging",
          status: i.status || "Coming Soon",
          description: i.description || "",
          upgrade_message: i.upgradeMessage || "",
          waitlisted: i.waitlisted ?? null,
          api_key_hint: i.apiKeyHint ?? null,
          connected_at: i.connectedAt || null
        })
      },
      {
        key: "integration_votes",
        table: "integration_votes",
        map: (v) => ({
          id: String(v.id),
          name: v.name || "",
          votes: Number(v.votes) || 0,
          voted: Boolean(v.voted)
        })
      },
      {
        key: "tracking_pixels",
        table: "tracking_pixels",
        map: (p) => ({
          id: String(p.id),
          name: p.name || "",
          type: p.type || "",
          pixel_id: p.pixelId || "",
          status: p.status || "Inactive"
        })
      },
      {
        key: "media_files",
        table: "media_files",
        map: (m) => ({
          id: String(m.id),
          name: m.name || "",
          type: m.type || "image",
          size: m.size || "",
          url: m.url || "",
          uploaded_at: m.uploadedAt || null,
          dimensions: m.dimensions ?? null,
          duration: m.duration ?? null
        })
      },
      {
        key: "custom_domains",
        table: "custom_domains",
        map: (d) => ({
          id: String(d.id),
          domain_name: d.domainName || d.hostname || "",
          type: d.type || "A",
          target_ip: d.targetIp || d.dnsTarget || "",
          status: d.status || "Pending"
        })
      },
      {
        key: "help_articles",
        table: "help_articles",
        map: (a) => ({
          id: String(a.id),
          title: a.title || "",
          category: a.category || "",
          excerpt: a.excerpt || "",
          read_time: a.readTime || "",
          content: a.content ?? null
        })
      },
      {
        key: "support_tickets",
        table: "support_tickets",
        map: (t) => ({
          id: String(t.id),
          subject: t.subject || "",
          message: t.message || "",
          status: t.status || "open",
          payload: t.payload || t,
          created_at: t.createdAt || new Date().toISOString()
        })
      },
      {
        key: "notifications",
        table: "app_notifications",
        map: (n) => ({
          id: String(n.id),
          type: n.type || "general",
          title: n.title || "",
          message: n.message || "",
          read: Boolean(n.read),
          created_at: n.createdAt || new Date().toISOString(),
          target_screen: n.targetScreen ?? null,
          meta: n.meta || {}
        })
      }
    ];

    for (const spec of workspaceMaps) {
      const rows = asArray(root[spec.key]).map(spec.map);
      if (!rows.length) continue;
      await upsertChunks(supabase, spec.table, rows);
      counts[spec.table] = rows.length;
    }

    if (root.publish_settings && typeof root.publish_settings === "object") {
      const p = root.publish_settings as any;
      await upsertChunks(
        supabase,
        "publish_settings",
        [
          {
            id: p.id || "default",
            primary_url: p.primaryUrl || "",
            custom_domains: p.customDomains || [],
            visibility: p.visibility || "public",
            selected_member_ids: p.selectedMemberIds || [],
            published_at: p.publishedAt || null,
            updated_at: p.updatedAt || new Date().toISOString()
          }
        ]
      );
      counts.publish_settings = 1;
    }

    return { ok: true, counts };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

function draftKey(row: Record<string, unknown>): string {
  return String(row.pageId || row.id || "");
}

/** Last-write-wins merge for bio page drafts (prevents empty client wipe on new devices). */
export function mergeBioPageDrafts(
  existing: unknown,
  incoming: unknown,
  ownerUserId?: string
): Record<string, unknown>[] {
  const map = new Map<string, Record<string, unknown>>();

  for (const row of asArray(existing)) {
    const key = draftKey(row);
    if (!key) continue;
    if (ownerUserId && row.ownerUserId && row.ownerUserId !== ownerUserId) continue;
    map.set(key, row);
  }

  for (const row of asArray(incoming)) {
    const key = draftKey(row);
    if (!key) continue;
    const stamped = ownerUserId ? { ...row, ownerUserId } : row;
    const prev = map.get(key);
    if (
      !prev ||
      new Date(String(stamped.updatedAt || 0)).getTime() >=
        new Date(String(prev.updatedAt || 0)).getTime()
    ) {
      map.set(key, stamped);
    }
  }

  return Array.from(map.values());
}

/** Map workspace payload from the browser into root + normalized tables. */
export function mergeWorkspaceIntoRoot(
  root: Record<string, unknown>,
  workspace: Record<string, unknown>,
  ownerUserId?: string
): Record<string, unknown> {
  const next = { ...root };
  const keys = [
    "whatsapp_campaigns",
    "whatsapp_templates",
    "smart_links",
    "qr_codes",
    "catalog_templates",
    "integrations",
    "integration_votes",
    "tracking_pixels",
    "media_files",
    "help_articles",
    "support_tickets",
    "notifications",
    "publish_settings"
  ] as const;

  for (const key of keys) {
    if (key === "qr_codes") continue;
    if (key in workspace) next[key] = workspace[key];
  }

  if ("qr_codes" in workspace) {
    next.qr_codes = mergeQrCodeLists(root.qr_codes, workspace.qr_codes, {
      pruneToIncomingForOwner: ownerUserId
    });
  }

  // Contacts: never replace wholesale — public bio Form/Smart Form leads live on the server
  // and would otherwise be wiped by a stale browser localStorage sync.
  if ("contacts" in workspace) {
    next.contacts = mergeContactLists(root.contacts, workspace.contacts, ownerUserId);
  }

  if ("bio_page_drafts" in workspace) {
    next.bio_page_drafts = mergeBioPageDrafts(
      root.bio_page_drafts,
      workspace.bio_page_drafts,
      ownerUserId
    );
  }

  return next;
}
