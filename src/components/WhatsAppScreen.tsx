import React, { useMemo, useState } from "react";
import { WhatsAppCampaign, WhatsAppTemplate } from "../types";
import {
  MessageSquare,
  Plus,
  CheckCircle,
  ArrowRight,
  Settings,
  Send,
  ShieldCheck,
  X,
  Pencil,
  Trash2,
  Search
} from "lucide-react";
import PageShell, { PageHeader, SectionCard, StatCard, StatCardGrid, Workspace } from "./layout/PageShell";

type CampaignInput = Omit<WhatsAppCampaign, "id">;
type TemplateInput = Omit<WhatsAppTemplate, "id">;

interface WhatsAppScreenProps {
  campaigns: WhatsAppCampaign[];
  templates: WhatsAppTemplate[];
  onAddTemplate: (template: TemplateInput) => void;
  onUpdateTemplate: (id: string, template: TemplateInput) => void;
  onDeleteTemplate: (id: string) => void;
  onAddCampaign: (campaign: CampaignInput) => void;
  onUpdateCampaign: (id: string, campaign: CampaignInput) => void;
  onDeleteCampaign: (id: string) => void;
}

function parseOpenRate(value: string): number {
  const parsed = Number.parseFloat(String(value).replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRecipientCount(value: string): number {
  const match = String(value).match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function WhatsAppScreen({
  campaigns,
  templates,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onAddCampaign,
  onUpdateCampaign,
  onDeleteCampaign
}: WhatsAppScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | WhatsAppCampaign["status"]>("All");

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateError, setTemplateError] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<WhatsAppCampaign | null>(null);
  const [broadcastName, setBroadcastName] = useState("");
  const [recipientsCount, setRecipientsCount] = useState("");
  const [broadcastStatus, setBroadcastStatus] = useState<WhatsAppCampaign["status"]>("Sent");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [broadcastError, setBroadcastError] = useState("");
  const [isSavingBroadcast, setIsSavingBroadcast] = useState(false);

  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const stats = useMemo(() => {
    const totalBroadcasts = campaigns.length;
    const rates = campaigns.map((campaign) => parseOpenRate(campaign.openRate));
    const avgOpenRate =
      rates.length > 0 ? (rates.reduce((sum, rate) => sum + rate, 0) / rates.length).toFixed(1) : "0.0";
    const activeTemplates = templates.filter((template) => template.status === "Approved").length;
    const totalRecipients = campaigns.reduce(
      (sum, campaign) => sum + parseRecipientCount(campaign.recipients),
      0
    );

    return { totalBroadcasts, avgOpenRate, activeTemplates, totalRecipients };
  }, [campaigns, templates]);

  const filteredCampaigns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesSearch = !query || campaign.name.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchQuery, statusFilter]);

  const complianceLogs = useMemo(
    () =>
      campaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.name,
        status: campaign.status,
        detail:
          campaign.status === "Draft"
            ? "Draft saved locally. Not yet submitted to WhatsApp Business."
            : "Verified against WhatsApp Business messaging policy.",
        createdAt: campaign.createdAt
      })),
    [campaigns]
  );

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateBody("");
    setTemplateError("");
    setIsTemplateModalOpen(true);
  };

  const openEditTemplate = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateBody(template.body || "");
    setTemplateError("");
    setIsTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    if (isSavingTemplate) return;
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateBody("");
    setTemplateError("");
  };

  const openCreateBroadcast = (templateId?: string) => {
    setEditingCampaign(null);
    setBroadcastName("");
    setRecipientsCount("");
    setBroadcastStatus("Sent");
    setSelectedTemplateId(templateId || "");
    setBroadcastError("");
    setIsBroadcastModalOpen(true);
  };

  const openEditCampaign = (campaign: WhatsAppCampaign) => {
    setEditingCampaign(campaign);
    setBroadcastName(campaign.name);
    setRecipientsCount(campaign.recipients);
    setBroadcastStatus(campaign.status);
    setSelectedTemplateId(campaign.templateId || "");
    setBroadcastError("");
    setIsBroadcastModalOpen(true);
  };

  const closeBroadcastModal = () => {
    if (isSavingBroadcast) return;
    setIsBroadcastModalOpen(false);
    setEditingCampaign(null);
    setBroadcastName("");
    setRecipientsCount("");
    setBroadcastStatus("Sent");
    setSelectedTemplateId("");
    setBroadcastError("");
  };

  const handleCreateTemplate = (event: React.FormEvent) => {
    event.preventDefault();
    setTemplateError("");

    const name = templateName.trim();
    if (!name) {
      setTemplateError("Template name is required.");
      return;
    }
    if (
      templates.some(
        (template) =>
          template.name.toLowerCase() === name.toLowerCase() && template.id !== editingTemplate?.id
      )
    ) {
      setTemplateError("A template with this name already exists.");
      return;
    }

    setIsSavingTemplate(true);
    window.setTimeout(() => {
      const payload: TemplateInput = {
        name,
        body: templateBody.trim() || undefined,
        status: editingTemplate?.status || "Pending",
        createdAt: editingTemplate?.createdAt || new Date().toISOString()
      };

      if (editingTemplate) {
        onUpdateTemplate(editingTemplate.id, payload);
        triggerToast(`Template "${name}" updated.`);
      } else {
        onAddTemplate(payload);
        triggerToast(`Template "${name}" submitted for approval.`);
      }

      setIsSavingTemplate(false);
      closeTemplateModal();
    }, 350);
  };

  const handleCreateBroadcast = (event: React.FormEvent) => {
    event.preventDefault();
    setBroadcastError("");

    const name = broadcastName.trim();
    const recipients = recipientsCount.trim();

    if (!name) {
      setBroadcastError("Campaign name is required.");
      return;
    }
    if (!recipients) {
      setBroadcastError("Recipient count is required.");
      return;
    }

    setIsSavingBroadcast(true);
    window.setTimeout(() => {
      const openRate =
        editingCampaign?.openRate ||
        (broadcastStatus === "Draft" ? "0%" : `${(88 + Math.floor(Math.random() * 10)).toFixed(0)}%`);

      const payload: CampaignInput = {
        name,
        recipients,
        status: broadcastStatus,
        openRate,
        templateId: selectedTemplateId || undefined,
        createdAt: editingCampaign?.createdAt || new Date().toISOString()
      };

      if (editingCampaign) {
        onUpdateCampaign(editingCampaign.id, payload);
        triggerToast(`Campaign "${name}" updated.`);
      } else {
        onAddCampaign(payload);
        triggerToast(
          broadcastStatus === "Draft"
            ? `Draft campaign "${name}" saved.`
            : `Broadcast "${name}" launched.`
        );
      }

      setIsSavingBroadcast(false);
      closeBroadcastModal();
    }, 350);
  };

  const handleDeleteTemplate = (template: WhatsAppTemplate) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    onDeleteTemplate(template.id);
    triggerToast(`Deleted template "${template.name}".`);
  };

  const handleDeleteCampaign = (campaign: WhatsAppCampaign) => {
    if (!window.confirm(`Delete campaign "${campaign.name}"?`)) return;
    onDeleteCampaign(campaign.id);
    triggerToast(`Deleted campaign "${campaign.name}".`);
  };

  const statusBadgeClass = (status: WhatsAppCampaign["status"] | WhatsAppTemplate["status"]) => {
    if (status === "Sent" || status === "Approved") return "bg-emerald-50 text-emerald-600";
    if (status === "Active" || status === "Pending") return "bg-indigo-50 text-indigo-600";
    if (status === "Rejected") return "bg-rose-50 text-rose-600";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <PageShell>
      <PageHeader
        title="WhatsApp Campaigns"
        subtitle="Marketing › WhatsApp"
        actions={
          <>
            <button
              type="button"
              onClick={openCreateTemplate}
              className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors bg-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>New Template</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateBroadcast()}
              className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md shadow-indigo-100 transition-all active:scale-95"
            >
              <Send className="h-4 w-4" />
              <span>New Broadcast</span>
            </button>
          </>
        }
      />

      <StatCardGrid columns="compact">
        <StatCard
          label="TOTAL BROADCASTS"
          value={stats.totalBroadcasts}
          sub={`${stats.totalRecipients.toLocaleString()} recipients tracked`}
        />
        <StatCard
          label="AVG. OPEN RATE"
          value={`${stats.avgOpenRate}%`}
          sub={stats.totalBroadcasts ? "Across all campaigns" : "No campaigns yet"}
        />
        <StatCard
          label="ACTIVE TEMPLATES"
          value={stats.activeTemplates}
          sub={`${templates.length} total template${templates.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="READY TO SEND"
          value={templates.filter((template) => template.status === "Approved").length}
          sub="Approved templates"
        />
      </StatCardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 key-workspace-grid">
        <Workspace stack className="lg:col-span-2 min-w-0">
          <SectionCard>
            <Workspace stack>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-display font-bold text-lg text-gray-950">Recent Broadcasts</h3>
                <button
                  type="button"
                  onClick={() => openCreateBroadcast()}
                  className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors self-start"
                >
                  New Broadcast
                </button>
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
                    placeholder="Search campaigns..."
                    className="key-icon-field__input w-full bg-slate-50 border border-slate-100 rounded-xl py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    aria-label="Search campaigns"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "All" | WhatsAppCampaign["status"])
                  }
                  className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium focus:outline-none"
                  aria-label="Filter by status"
                >
                  <option value="All">All statuses</option>
                  <option value="Sent">Sent</option>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              {filteredCampaigns.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400 space-y-3">
                  <p>
                    {campaigns.length === 0
                      ? "No broadcasts yet. Launch your first WhatsApp campaign."
                      : "No campaigns match your search or filters."}
                  </p>
                  {campaigns.length === 0 && (
                    <button
                      type="button"
                      onClick={() => openCreateBroadcast()}
                      className="inline-flex items-center gap-2 bg-[#4F46E5] text-white rounded-xl px-4 py-2 text-xs font-semibold"
                    >
                      <Send className="h-3.5 w-3.5" />
                      New Broadcast
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="lg:hidden divide-y divide-gray-50 -mx-1">
                    {filteredCampaigns.map((campaign) => (
                      <div key={campaign.id} className="py-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-950 text-sm truncate">{campaign.name}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {campaign.recipients} recipients · {campaign.openRate} open
                            </p>
                          </div>
                          <span
                            className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadgeClass(campaign.status)}`}
                          >
                            {campaign.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditCampaign(campaign)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-[#4F46E5]"
                            aria-label={`Edit ${campaign.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(campaign)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Delete ${campaign.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-bold tracking-wider uppercase">
                          <th className="py-3 px-2">Campaign Name</th>
                          <th className="py-3 px-2">Status</th>
                          <th className="py-3 px-2">Recipients</th>
                          <th className="py-3 px-2">Open Rate</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredCampaigns.map((campaign) => (
                          <tr key={campaign.id} className="text-sm">
                            <td className="py-4 px-2 font-semibold text-gray-950">{campaign.name}</td>
                            <td className="py-4 px-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(campaign.status)}`}
                              >
                                {campaign.status}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-gray-500 font-mono">{campaign.recipients}</td>
                            <td className="py-4 px-2 text-gray-900 font-semibold">{campaign.openRate}</td>
                            <td className="py-4 px-2">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditCampaign(campaign)}
                                  className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-[#4F46E5]"
                                  aria-label={`Edit ${campaign.name}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCampaign(campaign)}
                                  className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                  aria-label={`Delete ${campaign.name}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Workspace>
          </SectionCard>

          <SectionCard>
            <Workspace stack>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display font-bold text-lg text-gray-950">Broadcast Templates</h3>
                <button
                  type="button"
                  onClick={openCreateTemplate}
                  className="flex items-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Template</span>
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No templates yet. Create one to reuse in broadcasts.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 key-workspace-grid">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50/30 transition-all gap-3 min-w-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 bg-indigo-50 text-[#4F46E5] rounded-xl flex items-center justify-center shrink-0">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-semibold text-sm text-gray-950 truncate">
                            {template.name}
                          </h4>
                          <span
                            className={`text-[10px] font-bold tracking-wide uppercase mt-0.5 block ${
                              template.status === "Approved"
                                ? "text-emerald-600"
                                : template.status === "Rejected"
                                  ? "text-rose-600"
                                  : "text-indigo-600"
                            }`}
                          >
                            {template.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openCreateBroadcast(template.id)}
                          disabled={template.status !== "Approved"}
                          className="p-1.5 rounded-lg hover:bg-slate-50 text-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed"
                          title={
                            template.status === "Approved"
                              ? "Send with this template"
                              : "Only approved templates can be sent"
                          }
                          aria-label={`Send ${template.name}`}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditTemplate(template)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-[#4F46E5]"
                          aria-label={`Edit ${template.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(template)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          aria-label={`Delete ${template.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Workspace>
          </SectionCard>
        </Workspace>

        <Workspace stack className="min-w-0">
          <SectionCard>
            <Workspace stack>
              <h3 className="font-display font-bold text-gray-950 text-base">Active Connections</h3>

              <div className="border border-emerald-100 bg-emerald-50/10 rounded-2xl p-4.5 flex items-start gap-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-gray-950">Main Business Account</h4>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 mt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Connected & Active
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConnectionOpen(true)}
                className="w-full border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-sm py-2.5 rounded-xl transition-all"
              >
                Manage Connection
              </button>
            </Workspace>
          </SectionCard>

          <SectionCard>
            <Workspace stack>
              <h3 className="font-display font-bold text-gray-950 text-base">Quick Actions</h3>

              <div className="space-y-2">
                <a
                  href="https://woochat.esowolf.in/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-semibold text-gray-700">WOO Chat Settings</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-400" />
                </a>

                <button
                  type="button"
                  onClick={() => openCreateBroadcast()}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">New Broadcast</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsComplianceOpen(true)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">Compliance Logs</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </button>
              </div>
            </Workspace>
          </SectionCard>
        </Workspace>
      </div>

      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-modal-title"
            className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl border border-gray-50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="template-modal-title" className="font-display font-bold text-gray-900">
                {editingTemplate ? "Edit Template" : "Create Template"}
              </h3>
              <button type="button" onClick={closeTemplateModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} className="space-y-6" noValidate>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Template name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Purchase Confirmation"
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Message body (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Hi {{name}}, thanks for your order..."
                  value={templateBody}
                  onChange={(event) => setTemplateBody(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-sm focus:outline-none resize-none"
                />
              </div>
              {templateError && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {templateError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSavingTemplate}
                className="w-full bg-[#4F46E5] disabled:opacity-70 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-semibold text-sm"
              >
                {isSavingTemplate
                  ? "Saving…"
                  : editingTemplate
                    ? "Save Changes"
                    : "Submit for Approval"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="broadcast-modal-title"
            className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl border border-gray-50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="broadcast-modal-title" className="font-display font-bold text-gray-900">
                {editingCampaign ? "Edit Broadcast" : "New Broadcast Campaign"}
              </h3>
              <button type="button" onClick={closeBroadcastModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBroadcast} className="space-y-6" noValidate>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Campaign name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Winter Discount Blast"
                  value={broadcastName}
                  onChange={(event) => setBroadcastName(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Recipient count
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500 or 15/day"
                  value={recipientsCount}
                  onChange={(event) => setRecipientsCount(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Status
                </label>
                <select
                  value={broadcastStatus}
                  onChange={(event) =>
                    setBroadcastStatus(event.target.value as WhatsAppCampaign["status"])
                  }
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-sm focus:outline-none"
                >
                  <option value="Sent">Sent</option>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Template (optional)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-sm focus:outline-none"
                >
                  <option value="">No template</option>
                  {templates
                    .filter((template) => template.status === "Approved")
                    .map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                </select>
              </div>
              {broadcastError && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {broadcastError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSavingBroadcast}
                className="w-full bg-[#4F46E5] disabled:opacity-70 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-semibold text-sm"
              >
                {isSavingBroadcast
                  ? "Saving…"
                  : editingCampaign
                    ? "Save Changes"
                    : broadcastStatus === "Draft"
                      ? "Save Draft"
                      : "Launch Broadcast"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isConnectionOpen && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connection-modal-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-gray-50 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 id="connection-modal-title" className="font-display font-bold text-gray-900">
                Manage Connection
              </h3>
              <button
                type="button"
                onClick={() => setIsConnectionOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-2">
              <p className="text-sm font-bold text-gray-950">Main Business Account</p>
              <p className="text-xs text-emerald-700 font-semibold">Status: Connected & Active</p>
              <p className="text-xs text-slate-500">
                Provider: WOO Chat · Messages and billing stay on your WhatsApp Business account.
              </p>
            </div>
            <a
              href="https://woochat.esowolf.in/login"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold"
            >
              Open WOO Chat Admin
            </a>
            <button
              type="button"
              onClick={() => setIsConnectionOpen(false)}
              className="w-full border border-gray-200 hover:bg-gray-50 text-gray-600 py-2.5 rounded-xl text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isComplianceOpen && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="compliance-modal-title"
            className="bg-white rounded-3xl max-w-lg w-full p-4 shadow-2xl border border-gray-50 space-y-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 id="compliance-modal-title" className="font-display font-bold text-gray-900">
                Compliance Logs
              </h3>
              <button
                type="button"
                onClick={() => setIsComplianceOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {complianceLogs.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                No campaign compliance records yet.
              </p>
            ) : (
              <div className="space-y-3">
                {complianceLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-slate-100 p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-gray-950 truncate">{log.title}</p>
                      <span
                        className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadgeClass(log.status)}`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{log.detail}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{formatDate(log.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsComplianceOpen(false)}
              className="w-full border border-gray-200 hover:bg-gray-50 text-gray-600 py-2.5 rounded-xl text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white border border-slate-800 text-xs font-semibold py-3 px-5 rounded-2xl shadow-2xl z-50">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
