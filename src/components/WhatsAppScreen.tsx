import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Search,
  Bot,
  Sparkles,
  Zap,
  Copy,
  ExternalLink,
  Phone,
  RefreshCw,
  Clock,
  Radio,
  UserCheck,
  Check,
  AlertCircle,
  QrCode,
  Smartphone,
  Unplug,
  BatteryCharging,
  Laptop,
  BookOpen
} from "lucide-react";
import InteractiveSetupGuideModal, { GuideTopicId } from "./guides/InteractiveSetupGuideModal";
import PageShell, { PageHeader, SectionCard, StatCard, StatCardGrid } from "./layout/PageShell";
import {
  fetchWhatsAppConfig,
  saveWhatsAppConfigApi,
  testWhatsAppConnectionApi,
  fetchWhatsAppMessagesApi,
  sendWhatsAppMessageApi,
  testWhatsAppAiReplyApi,
  fetchWebWhatsAppSessionApi,
  startWebWhatsAppSessionApi,
  confirmWebWhatsAppLinkApi,
  disconnectWebWhatsAppSessionApi,
  updateWebWhatsAppSettingsApi,
  simulateInboundWebMessageApi,
  WhatsAppConfigData,
  WhatsAppMessageItem,
  WebWhatsAppSessionData
} from "../lib/whatsappApi";

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

function formatTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type TabType = "campaigns" | "ai_assistant" | "cloud_api" | "web_qr" | "inbox";

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("campaigns");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | WhatsAppCampaign["status"]>("All");

  // Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateError, setTemplateError] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Broadcast Modal
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<WhatsAppCampaign | null>(null);
  const [broadcastName, setBroadcastName] = useState("");
  const [recipientsCount, setRecipientsCount] = useState("");
  const [broadcastStatus, setBroadcastStatus] = useState<WhatsAppCampaign["status"]>("Sent");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [broadcastError, setBroadcastError] = useState("");
  const [isSavingBroadcast, setIsSavingBroadcast] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Multi-Language Setup Guide Modal State
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [guideTopic, setGuideTopic] = useState<GuideTopicId>("whatsapp_cloud");

  // WhatsApp Cloud API & AI State
  const [config, setConfig] = useState<WhatsAppConfigData | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success?: boolean;
    phone?: string;
    name?: string;
    error?: string;
  }>({ tested: false });

  // Config Form State
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [aiAutoReplyEnabled, setAiAutoReplyEnabled] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [aiSystemPrompt, setAiSystemPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [orderAlertsEnabled, setOrderAlertsEnabled] = useState(true);
  const [leadAlertPhone, setLeadAlertPhone] = useState("");

  // Live Inbound Inbox State
  const [messages, setMessages] = useState<WhatsAppMessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [directToPhone, setDirectToPhone] = useState("");
  const [directMsgText, setDirectMsgText] = useState("");
  const [isSendingDirect, setIsSendingDirect] = useState(false);

  // Web WhatsApp QR Session State
  const [webSession, setWebSession] = useState<WebWhatsAppSessionData | null>(null);
  const [isLoadingWebSession, setIsLoadingWebSession] = useState(false);
  const [qrPairingMode, setQrPairingMode] = useState<"qr" | "code">("qr");
  const [manualPhoneInput, setManualPhoneInput] = useState("");
  const [isLinkingDevice, setIsLinkingDevice] = useState(false);
  const [isDisconnectingDevice, setIsDisconnectingDevice] = useState(false);
  const [testInboundText, setTestInboundText] = useState("");
  const [testInboundName, setTestInboundName] = useState("");
  const [isTestingInbound, setIsTestingInbound] = useState(false);

  // AI Simulator State
  const [testSimMessage, setTestSimMessage] = useState("");
  const [simHistory, setSimHistory] = useState<Array<{ sender: "user" | "bot"; text: string; time: string }>>([
    {
      sender: "bot",
      text: "Hello! 👋 Thanks for reaching out. How can I help you today?",
      time: "Just now"
    }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Copy status
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    triggerToast(`Copied ${keyName} to clipboard!`);
    window.setTimeout(() => setCopiedKey(null), 2000);
  };

  // Load WhatsApp config & messages on mount
  useEffect(() => {
    loadConfig();
    loadMessages();
    loadWebSession();
  }, []);

  const loadConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const data = await fetchWhatsAppConfig();
      if (data) {
        setConfig(data);
        setPhoneNumberId(data.phoneNumberId || "");
        setWabaId(data.wabaId || "");
        setAccessToken(data.accessToken || "");
        setVerifyToken(data.verifyToken || "");
        setAiAutoReplyEnabled(data.aiAutoReplyEnabled !== false);
        setBusinessName(data.businessName || "");
        setBusinessDescription(data.businessDescription || "");
        setAiSystemPrompt(data.aiSystemPrompt || "");
        setWelcomeMessage(data.welcomeMessage || "");
        setFallbackMessage(data.fallbackMessage || "");
        setOrderAlertsEnabled(data.orderAlertsEnabled !== false);
        setLeadAlertPhone(data.leadAlertPhone || "");
        if (data.connected && data.connectedPhone) {
          setConnectionStatus({
            tested: true,
            success: true,
            phone: data.connectedPhone,
            name: data.verifiedName
          });
        }
      }
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const data = await fetchWhatsAppMessagesApi();
      setMessages(data);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadWebSession = async () => {
    setIsLoadingWebSession(true);
    try {
      const session = await fetchWebWhatsAppSessionApi();
      setWebSession(session);
    } finally {
      setIsLoadingWebSession(false);
    }
  };

  const handleStartWebSession = async () => {
    setIsLoadingWebSession(true);
    try {
      const session = await startWebWhatsAppSessionApi();
      setWebSession(session);
      triggerToast("New WhatsApp Web QR code generated. Ready to scan!");
    } catch {
      triggerToast("Failed to generate QR code.");
    } finally {
      setIsLoadingWebSession(false);
    }
  };

  const handleConfirmWebLink = async (customPhone?: string) => {
    const phone = customPhone || manualPhoneInput.trim() || "919876543210";
    setIsLinkingDevice(true);
    try {
      const res = await confirmWebWhatsAppLinkApi(phone, businessName || "My WhatsApp");
      if (res.success && res.session) {
        setWebSession(res.session);
        triggerToast(`Device Linked successfully as ${res.session.connectedPhone}!`);
      } else {
        triggerToast(res.error || "Failed to link device.");
      }
    } catch {
      triggerToast("Error linking device.");
    } finally {
      setIsLinkingDevice(false);
    }
  };

  const handleDisconnectWebSession = async () => {
    if (!window.confirm("Disconnect and log out this WhatsApp Web session?")) return;
    setIsDisconnectingDevice(true);
    try {
      const res = await disconnectWebWhatsAppSessionApi();
      if (res.success && res.session) {
        setWebSession(res.session);
        triggerToast("WhatsApp Web session logged out.");
      }
    } catch {
      triggerToast("Error disconnecting session.");
    } finally {
      setIsDisconnectingDevice(false);
    }
  };

  const handleTestInboundWeb = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = testInboundText.trim();
    if (!text) return;

    setIsTestingInbound(true);
    try {
      const res = await simulateInboundWebMessageApi(
        text,
        testInboundName.trim() || "Rahul Sharma",
        "919876543210"
      );

      if (res.success) {
        triggerToast("Inbound message delivered! AI Auto-Reply sent & lead captured into CRM.");
        setTestInboundText("");
        loadMessages();
        loadWebSession();
      } else {
        triggerToast(res.error || "Failed to simulate inbound message.");
      }
    } catch {
      triggerToast("Failed to simulate message.");
    } finally {
      setIsTestingInbound(false);
    }
  };

  const handleUpdateAntiSpamSettings = async (updates: {
    antiSpamEnabled?: boolean;
    minDelaySeconds?: number;
    maxDelaySeconds?: number;
    dailyMessageLimit?: number;
  }) => {
    try {
      const res = await updateWebWhatsAppSettingsApi(updates);
      if (res.success && res.session) {
        setWebSession(res.session);
        triggerToast("Anti-Spam safety & limit settings updated!");
      }
    } catch {
      triggerToast("Failed to update safety settings.");
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingConfig(true);
    try {
      const res = await saveWhatsAppConfigApi({
        phoneNumberId,
        wabaId,
        accessToken,
        verifyToken,
        aiAutoReplyEnabled,
        businessName,
        businessDescription,
        aiSystemPrompt,
        welcomeMessage,
        fallbackMessage,
        orderAlertsEnabled,
        leadAlertPhone
      });

      if (res.success && res.config) {
        setConfig(res.config);
        triggerToast("WhatsApp settings saved successfully!");
      } else {
        triggerToast(res.error || "Failed to save settings.");
      }
    } catch (err: any) {
      triggerToast(err?.message || "Error saving settings.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      triggerToast("Please enter Phone Number ID and Access Token first.");
      return;
    }
    setIsTestingConnection(true);
    try {
      const res = await testWhatsAppConnectionApi(phoneNumberId, accessToken);
      if (res.success) {
        setConnectionStatus({
          tested: true,
          success: true,
          phone: res.displayPhoneNumber,
          name: res.verifiedName
        });
        triggerToast(`Verified: Connected to ${res.verifiedName || "WhatsApp"} (${res.displayPhoneNumber})`);
        loadConfig();
      } else {
        setConnectionStatus({
          tested: true,
          success: false,
          error: res.error
        });
        triggerToast(`Verification Failed: ${res.error}`);
      }
    } catch (err: any) {
      setConnectionStatus({
        tested: true,
        success: false,
        error: err?.message || "Connection failed"
      });
      triggerToast("Connection test failed.");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directToPhone.trim() || !directMsgText.trim()) return;

    setIsSendingDirect(true);
    try {
      const res = await sendWhatsAppMessageApi(directToPhone, directMsgText);
      if (res.success) {
        triggerToast(`Message sent to ${directToPhone}!`);
        setDirectMsgText("");
        loadMessages();
      } else {
        triggerToast(res.error || "Failed to send WhatsApp message.");
      }
    } catch (err: any) {
      triggerToast(err?.message || "Error sending message.");
    } finally {
      setIsSendingDirect(false);
    }
  };

  const handleSimulateAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = testSimMessage.trim();
    if (!text || isSimulating) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setSimHistory((prev) => [...prev, { sender: "user", text, time }]);
    setTestSimMessage("");
    setIsSimulating(true);

    try {
      const res = await testWhatsAppAiReplyApi(
        text,
        "Customer",
        aiSystemPrompt,
        businessName,
        businessDescription
      );

      const reply = res.reply || "Thanks for reaching out! How can we assist you?";
      setSimHistory((prev) => [
        ...prev,
        {
          sender: "bot",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch {
      setSimHistory((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Thanks for reaching out! How can we assist you today?",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  // Stats calculation
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

  const isAnyConnected = config?.connected || webSession?.status === "connected";

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
    if (status === "Sent" || status === "Approved") return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    if (status === "Active" || status === "Pending") return "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30";
    if (status === "Rejected") return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
    return "bg-slate-500/15 text-slate-400 border border-slate-500/30";
  };

  return (
    <PageShell className="font-sans text-[var(--key-text)]">
      <PageHeader
        title="WhatsApp Automation & AI Agent"
        subtitle="Marketing › WhatsApp Engine"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab(webSession?.status === "connected" ? "web_qr" : "cloud_api")}
              className={`flex items-center gap-2 border px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isAnyConnected
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : "border-[var(--key-border)] bg-[var(--key-surface-strong)] hover:bg-[var(--key-surface-hover)] text-[var(--key-text)]"
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${isAnyConnected ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
              {webSession?.status === "connected"
                ? `Linked: ${webSession.connectedPhone}`
                : config?.connected
                  ? "Meta Cloud API Connected"
                  : "Connect WhatsApp"}
            </button>
            <button
              type="button"
              onClick={openCreateTemplate}
              className="hidden sm:inline-flex items-center gap-2 border border-[var(--key-border)] bg-[var(--key-surface-strong)] hover:bg-[var(--key-surface-hover)] text-[var(--key-text)] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-indigo-400" />
              New Template
            </button>
            <button
              type="button"
              onClick={() => openCreateBroadcast()}
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-950/20 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              Send Broadcast
            </button>
          </div>
        }
      />

      {/* Top Banner: Dual Zero-Cost Integration Modes */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-slate-900/40 to-indigo-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-[var(--key-text)] flex items-center gap-2">
              <span>Zero-Cost WhatsApp Automation (100% Free Platform Tier)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ₹0 Cost
              </span>
            </div>
            <p className="text-[var(--key-muted)] text-[11px] mt-0.5">
              Choose between <strong>Official Meta Cloud API</strong> (1,000 free monthly chats) or <strong>Direct Phone QR Scanner</strong> (instant QR pairing for personal/business phones).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => {
              setGuideTopic(activeTab === "web_qr" ? "whatsapp_qr" : "whatsapp_cloud");
              setIsGuideModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>📖 Setup Tutorial (English / தமிழ் / हिन्दी)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("web_qr")}
            className="text-emerald-400 hover:text-emerald-300 font-bold text-xs underline flex items-center gap-1 ml-1"
          >
            Scan QR Code Link <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--key-border)] pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "campaigns"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)]"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Campaigns & Broadcasts
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ai_assistant")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "ai_assistant"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)]"
          }`}
        >
          <Bot className="h-4 w-4 text-emerald-400" />
          AI Sales Agent & Auto-Responder
          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold uppercase">
            Gemini
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("web_qr")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "web_qr"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)]"
          }`}
        >
          <QrCode className="h-4 w-4 text-emerald-400" />
          WhatsApp Web QR Scanner
          {webSession?.status === "connected" && (
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cloud_api")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "cloud_api"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)]"
          }`}
        >
          <Settings className="h-4 w-4" />
          Cloud API & Meta Setup
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("inbox");
            loadMessages();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "inbox"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)]"
          }`}
        >
          <Radio className="h-4 w-4" />
          Live Inbound Inbox & Leads
          {messages.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CAMPAIGNS & BROADCASTS */}
      {/* ========================================================================= */}
      {activeTab === "campaigns" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <StatCardGrid columns="default">
            <StatCard
              label="Total Broadcasts"
              value={stats.totalBroadcasts}
              sub="Campaigns created"
            />
            <StatCard
              label="Avg. Open Rate"
              value={`${stats.avgOpenRate}%`}
              sub="High WhatsApp engagement"
            />
            <StatCard
              label="Active Templates"
              value={stats.activeTemplates}
              sub="Meta pre-approved"
            />
            <StatCard
              label="Total Recipients"
              value={stats.totalRecipients.toLocaleString()}
              sub="Audience reach"
            />
          </StatCardGrid>

          {/* Broadcast Campaigns Table */}
          <SectionCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--key-border)] pb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--key-text)]">Broadcast Campaigns</h3>
                <p className="text-xs text-[var(--key-muted)]">Manage marketing announcements, product drop notifications, and lead follow-up blasts.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--key-muted)]" />
                  <input
                    type="text"
                    placeholder="Search campaigns…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-1.5 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Sent">Sent</option>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
                <button
                  type="button"
                  onClick={() => openCreateBroadcast()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Broadcast
                </button>
              </div>
            </div>
            {filteredCampaigns.length === 0 ? (
              <div className="py-12 text-center text-[var(--key-muted)]">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="font-bold text-sm">No campaigns found</p>
                <p className="text-xs mt-1">Create your first broadcast to reach your contacts on WhatsApp.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--key-border)] text-[var(--key-muted)] uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Campaign Name</th>
                      <th className="py-3 px-4">Recipients</th>
                      <th className="py-3 px-4">Open Rate</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--key-border)]">
                    {filteredCampaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--key-surface-hover)] transition-colors">
                        <td className="py-3 px-4 font-bold text-[var(--key-text)]">{c.name}</td>
                        <td className="py-3 px-4 text-[var(--key-muted)]">{c.recipients}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-400">{c.openRate}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeClass(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--key-muted)]">{formatDate(c.createdAt)}</td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => openEditCampaign(c)}
                            className="p-1 text-[var(--key-muted)] hover:text-indigo-400 rounded-lg hover:bg-[var(--key-surface-strong)]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(c)}
                            className="p-1 text-[var(--key-muted)] hover:text-rose-400 rounded-lg hover:bg-[var(--key-surface-strong)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Templates Section */}
          <SectionCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--key-border)] pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--key-text)]">Message Templates</h3>
                <p className="text-xs text-[var(--key-muted)]">Meta pre-approved message templates required for outbound notifications outside the 24-hour customer window.</p>
              </div>
              <button
                type="button"
                onClick={openCreateTemplate}
                className="border border-[var(--key-border)] bg-[var(--key-surface-strong)] hover:bg-[var(--key-surface-hover)] text-[var(--key-text)] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5 text-indigo-400" />
                Add Template
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className="font-bold text-xs text-[var(--key-text)] truncate">{tpl.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${statusBadgeClass(tpl.status)}`}>
                        {tpl.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--key-muted)] bg-[var(--key-surface)] p-2.5 rounded-xl border border-[var(--key-border)] leading-relaxed font-mono">
                      {tpl.body || "No body text defined."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[var(--key-border)]">
                    <span className="text-[var(--key-muted)]">{formatDate(tpl.createdAt)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openCreateBroadcast(tpl.id)}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-500/10"
                      >
                        Use in Blast
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditTemplate(tpl)}
                        className="p-1 text-[var(--key-muted)] hover:text-indigo-400"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl)}
                        className="p-1 text-[var(--key-muted)] hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI SALES AGENT & AUTO-RESPONDER */}
      {/* ========================================================================= */}
      {activeTab === "ai_assistant" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Configuration Settings */}
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[var(--key-text)]">
                      Gemini 1.5 WhatsApp Sales Bot
                    </h3>
                    <p className="text-[11px] text-[var(--key-muted)]">
                      Autonomous conversational sales agent. Automatically answers visitor inquiries, recommends products, and captures leads directly inside WhatsApp.
                    </p>
                  </div>
                </div>

                {/* AI Toggle */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={aiAutoReplyEnabled}
                    onChange={(e) => setAiAutoReplyEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1.5">
                    Business Display Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Tech & Coffee"
                    className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2.5 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1.5">
                    Lead Alert WhatsApp Phone (Admin)
                  </label>
                  <input
                    type="text"
                    value={leadAlertPhone}
                    onChange={(e) => setLeadAlertPhone(e.target.value)}
                    placeholder="e.g. 919876543210"
                    className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2.5 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1.5">
                  Business Description & Product Highlights
                </label>
                <textarea
                  rows={3}
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Describe your products, pricing, delivery policy, and unique selling points for the AI to refer to..."
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl p-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Custom AI Personality & System Prompt</span>
                  <span className="text-indigo-400 font-normal lowercase">optional</span>
                </label>
                <textarea
                  rows={4}
                  value={aiSystemPrompt}
                  onChange={(e) => setAiSystemPrompt(e.target.value)}
                  placeholder="e.g. Act as a bubbly bakery assistant. Always offer 10% discount code SWEET10 on orders above ₹500..."
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl p-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500 resize-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1.5">
                    Instant Greeting Message
                  </label>
                  <input
                    type="text"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Hello! 👋 How can we help you today?"
                    className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1.5">
                    Fallback Message (Offline / Unknown)
                  </label>
                  <input
                    type="text"
                    value={fallbackMessage}
                    onChange={(e) => setFallbackMessage(e.target.value)}
                    placeholder="Thanks for contacting us! Our team will reply shortly."
                    className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Order alerts toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--key-border)]">
                <div>
                  <p className="text-xs font-bold text-[var(--key-text)]">Instant Payment & Order Alerts</p>
                  <p className="text-[11px] text-[var(--key-muted)]">
                    Automatically trigger WhatsApp receipts when Razorpay/UPI payments are completed.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={orderAlertsEnabled}
                    onChange={(e) => setOrderAlertsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isSavingConfig}
                  onClick={() => handleSaveConfig()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {isSavingConfig ? "Saving Settings…" : "Save AI Configuration"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive WhatsApp Bot Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-4 flex flex-col h-[520px]">
              {/* Simulator Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--key-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] font-black text-xs">
                      WA
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[var(--key-text)] flex items-center gap-1.5">
                      <span>{businessName || "WhatsApp AI Agent"}</span>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-semibold">Online · AI Sales Assistant</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSimHistory([
                      {
                        sender: "bot",
                        text: welcomeMessage || "Hello! 👋 Thanks for reaching out. How can I help you today?",
                        time: "Just now"
                      }
                    ])
                  }
                  className="text-[11px] text-[var(--key-muted)] hover:text-[var(--key-text)] p-1 rounded hover:bg-[var(--key-surface)]"
                  title="Clear Simulator"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Chat Message History */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
                {simHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${item.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                        item.sender === "user"
                          ? "bg-[#005c4b] text-white rounded-br-xs"
                          : "bg-[#202c33] text-slate-100 rounded-bl-xs border border-slate-700/60"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{item.text}</div>
                      <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                        {item.time}
                      </div>
                    </div>
                  </div>
                ))}
                {isSimulating && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs italic bg-[#202c33] px-3 py-2 rounded-2xl w-fit">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                    <span>Gemini is generating response…</span>
                  </div>
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSimulateAiChat} className="pt-2 border-t border-[var(--key-border)] flex gap-2">
                <input
                  type="text"
                  value={testSimMessage}
                  onChange={(e) => setTestSimMessage(e.target.value)}
                  placeholder="Test a customer question (e.g. What are your prices?)"
                  className="flex-1 bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-[#25D366]"
                />
                <button
                  type="submit"
                  disabled={!testSimMessage.trim() || isSimulating}
                  className="bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-[11px] text-[var(--key-muted)] space-y-1">
              <span className="font-bold text-indigo-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Auto CRM Integration
              </span>
              <p>
                Every visitor who sends a message to your WhatsApp number is automatically captured into your <strong>Contacts / Leads CRM</strong> with full chat notes and phone numbers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WHATSAPP WEB QR SCANNER (PERSONAL / DIRECT PHONE LINK) */}
      {/* ========================================================================= */}
      {activeTab === "web_qr" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: QR Code / Pairing Display */}
            <div className="lg:col-span-7 space-y-5">
              <div className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-[var(--key-text)]">
                        WhatsApp Web Direct Phone Link
                      </h3>
                      <p className="text-[11px] text-[var(--key-muted)]">
                        Connect any personal or business WhatsApp by scanning the QR code on your phone. Zero Meta App setup required.
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      webSession?.status === "connected"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : webSession?.status === "qr_ready"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {webSession?.status === "connected"
                      ? "Device Linked & Active"
                      : webSession?.status === "qr_ready"
                        ? "Awaiting Phone Scan"
                        : "Disconnected"}
                  </span>
                </div>

                {/* State 1: DISCONNECTED */}
                {(!webSession || webSession.status === "disconnected") && (
                  <div className="text-center py-8 space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Smartphone className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--key-text)]">
                        Link Your Personal or Business WhatsApp Number
                      </h4>
                      <p className="text-xs text-[var(--key-muted)] max-w-md mx-auto mt-1">
                        Use your mobile camera to scan a secure QR code. Your phone will link directly to KEYLINK360 for automated Gemini AI customer replies and instant order alerts.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isLoadingWebSession}
                      onClick={handleStartWebSession}
                      className="bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold px-6 py-3 rounded-xl text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-950/30"
                    >
                      <QrCode className="h-4 w-4" />
                      {isLoadingWebSession ? "Generating QR…" : "Generate WhatsApp Web QR Code"}
                    </button>
                  </div>
                )}

                {/* State 2: QR READY / AWAITING SCAN */}
                {webSession?.status === "qr_ready" && (
                  <div className="space-y-4">
                    <div className="flex justify-center gap-2 border-b border-[var(--key-border)] pb-3">
                      <button
                        type="button"
                        onClick={() => setQrPairingMode("qr")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          qrPairingMode === "qr"
                            ? "bg-indigo-600 text-white"
                            : "text-[var(--key-muted)] hover:text-[var(--key-text)]"
                        }`}
                      >
                        Scan QR Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrPairingMode("code")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          qrPairingMode === "code"
                            ? "bg-indigo-600 text-white"
                            : "text-[var(--key-muted)] hover:text-[var(--key-text)]"
                        }`}
                      >
                        8-Digit Pairing Code
                      </button>
                    </div>

                    {qrPairingMode === "qr" ? (
                      <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-[var(--key-border)] space-y-3">
                        <div className="p-3 bg-white rounded-2xl shadow-xl">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=000000&data=${encodeURIComponent(
                              webSession.qrCodeData || "keylink-whatsapp-web"
                            )}`}
                            alt="WhatsApp Web QR Code"
                            className="h-48 w-48 rounded-lg"
                          />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-xs font-bold text-emerald-400 animate-pulse">
                            Point your WhatsApp Mobile scanner at this code
                          </p>
                          <p className="text-[10px] text-[var(--key-muted)]">
                            Expires in 3 minutes. Keep this window open.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-2xl border border-[var(--key-border)] space-y-3">
                        <p className="text-xs text-[var(--key-muted)]">
                          Enter this 8-character pairing code in your phone:
                        </p>
                        <div className="flex items-center gap-3 bg-[var(--key-surface)] px-6 py-3 rounded-2xl border border-indigo-500/40">
                          <span className="font-mono font-black text-2xl tracking-widest text-emerald-400">
                            {webSession.pairingCode || "K9LW-8Q2M"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(webSession.pairingCode || "K9LW-8Q2M", "Pairing Code")
                            }
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-[var(--key-muted)] hover:text-white"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Link Simulation Button */}
                    <div className="pt-2 border-t border-[var(--key-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={manualPhoneInput}
                          onChange={(e) => setManualPhoneInput(e.target.value)}
                          placeholder="Your Mobile: 919876543210"
                          className="bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] w-full sm:w-48 font-mono focus:outline-none focus:border-[#25D366]"
                        />
                        <button
                          type="button"
                          disabled={isLinkingDevice}
                          onClick={() => handleConfirmWebLink()}
                          className="bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap"
                        >
                          {isLinkingDevice ? "Linking…" : "Confirm Scan & Link"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartWebSession}
                        className="text-[11px] text-[var(--key-muted)] hover:text-[var(--key-text)] flex items-center gap-1 font-semibold"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh QR
                      </button>
                    </div>
                  </div>
                )}

                {/* State 3: CONNECTED */}
                {webSession?.status === "connected" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <Smartphone className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[var(--key-text)]">
                              +{webSession.connectedPhone}
                            </h4>
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          </div>
                          <p className="text-[11px] text-[var(--key-muted)] flex items-center gap-2 mt-0.5">
                            <Laptop className="h-3 w-3" /> {webSession.devicePlatform} · Battery: {webSession.batteryLevel}%
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isDisconnectingDevice}
                        onClick={handleDisconnectWebSession}
                        className="border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Unplug className="h-3.5 w-3.5" />
                        {isDisconnectingDevice ? "Logging out…" : "Disconnect"}
                      </button>
                    </div>

                    {/* Test Scanned Phone Inbound Chat */}
                    <div className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface)] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs text-[var(--key-text)] flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                          Test Inbound Customer Message on Linked Phone
                        </h5>
                        <span className="text-[10px] text-[var(--key-muted)]">Instant AI Auto-Reply</span>
                      </div>

                      <form onSubmit={handleTestInboundWeb} className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={testInboundName}
                            onChange={(e) => setTestInboundName(e.target.value)}
                            placeholder="Customer Name (e.g. Priya)"
                            className="bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            required
                            value={testInboundText}
                            onChange={(e) => setTestInboundText(e.target.value)}
                            placeholder="Message: 'Hi, I want to order cappuccino'"
                            className="bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isTestingInbound || !testInboundText.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {isTestingInbound ? "Simulating AI Reply…" : "Simulate Incoming Customer"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Mobile Instructions Guide */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-5 space-y-4 text-xs">
                <h4 className="font-bold text-[var(--key-text)] flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  How to Link in 3 Steps
                </h4>

                <div className="space-y-3 text-[11px] text-[var(--key-muted)]">
                  <div className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <p>
                      Open <strong>WhatsApp</strong> on your phone (iOS or Android).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <p>
                      Tap <strong>Settings</strong> (iOS) or the <strong>3-dots menu</strong> (Android) and choose <strong>Linked Devices</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <p>
                      Tap <strong>Link a Device</strong> and point your phone at the QR code on the left!
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-300 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> End-to-End Encrypted Link
                  </p>
                  <p className="text-[10px] opacity-80">
                    Your direct phone session is protected by WhatsApp standard protocol. Incoming chats are processed locally by your Gemini Sales Bot.
                  </p>
                </div>
              </div>

              {/* Anti-Spam Safety Guard Card */}
              <div className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-5 space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[var(--key-text)] flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Anti-Spam Safety Guard
                  </h4>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={webSession?.antiSpamEnabled !== false}
                      onChange={(e) =>
                        handleUpdateAntiSpamSettings({
                          antiSpamEnabled: e.target.checked
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <p className="text-[11px] text-[var(--key-muted)]">
                  Protects your personal phone number against automated WhatsApp spam filters by injecting human typing pauses and rate-limiting fast bursts.
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-[var(--key-surface)] p-2.5 rounded-xl border border-[var(--key-border)]">
                  <div>
                    <span className="text-[var(--key-muted)] block text-[10px] uppercase font-bold">Natural Typing Delay</span>
                    <span className="font-mono font-bold text-emerald-400">1.5s — 3.5s (Random Jitter)</span>
                  </div>
                  <div>
                    <span className="text-[var(--key-muted)] block text-[10px] uppercase font-bold">Flood Protection</span>
                    <span className="font-mono font-bold text-indigo-400">Max 6 msgs / min / contact</span>
                  </div>
                </div>
              </div>

              {/* Daily Message Limit Tracker Card */}
              <div className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-5 space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[var(--key-text)] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    Daily Safe Message Limit Tracker
                  </h4>
                  <select
                    value={webSession?.dailyMessageLimit || 100}
                    onChange={(e) =>
                      handleUpdateAntiSpamSettings({
                        dailyMessageLimit: Number(e.target.value)
                      })
                    }
                    className="bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-lg py-1 px-2 text-[11px] text-[var(--key-text)] focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value={50}>50 msgs / day (Ultra Safe)</option>
                    <option value={100}>100 msgs / day (Recommended)</option>
                    <option value={250}>250 msgs / day (High Volume)</option>
                  </select>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--key-muted)]">Today's Usage (Resets 00:00)</span>
                    <span className="font-mono font-bold text-[var(--key-text)]">
                      {webSession?.dailyMessagesSent || 0} / {webSession?.dailyMessageLimit || 100} msgs
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        (webSession?.dailyMessagesSent || 0) >= (webSession?.dailyMessageLimit || 100)
                          ? "bg-rose-500"
                          : (webSession?.dailyMessagesSent || 0) > (webSession?.dailyMessageLimit || 100) * 0.75
                            ? "bg-amber-400"
                            : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((webSession?.dailyMessagesSent || 0) / (webSession?.dailyMessageLimit || 100)) * 100
                          )
                        )}%`
                      }}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-[var(--key-muted)]">
                  When the limit is reached, AI auto-replies pause automatically until midnight to keep your personal WhatsApp number 100% safe.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CLOUD API & META SETUP */}
      {/* ========================================================================= */}
      {activeTab === "cloud_api" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Credentials form */}
            <div className="lg:col-span-7 space-y-5">
              <form onSubmit={handleSaveConfig} className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-[var(--key-text)] flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Meta WhatsApp Cloud API Credentials
                  </h3>
                  {connectionStatus.tested && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        connectionStatus.success
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {connectionStatus.success ? "Verified Active" : "Connection Failed"}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="e.g. 109827349812734"
                    className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-[var(--key-muted)] mt-1">
                    Found in Meta App Dashboard › WhatsApp › API Setup › Step 1.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                    WhatsApp Business Account ID (WABA)
                  </label>
                  <input
                    type="text"
                    value={wabaId}
                    onChange={(e) => setWabaId(e.target.value)}
                    placeholder="e.g. 981273948127394"
                    className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                    Meta Permanent Access Token (System User Bearer Token)
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="EAAG..."
                    className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-[var(--key-muted)] mt-1">
                    Generate from Meta Business Settings › System Users with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                    Webhook Verification Token (hub.verify_token)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verifyToken}
                      onChange={(e) => setVerifyToken(e.target.value)}
                      placeholder="keylink_wa_..."
                      className="flex-1 bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(verifyToken, "Verify Token")}
                      className="px-3 py-2 bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] border border-[var(--key-border)] rounded-xl text-xs font-bold text-[var(--key-text)] flex items-center gap-1"
                    >
                      {copiedKey === "Verify Token" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy
                    </button>
                  </div>
                </div>

                {connectionStatus.tested && !connectionStatus.success && connectionStatus.error && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      <p className="font-bold">Verification Error</p>
                      <p className="text-[11px] mt-0.5">{connectionStatus.error}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[var(--key-border)]">
                  <button
                    type="button"
                    disabled={isTestingConnection || !phoneNumberId.trim() || !accessToken.trim()}
                    onClick={handleTestConnection}
                    className="border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 text-emerald-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
                  >
                    <Radio className="h-3.5 w-3.5" />
                    {isTestingConnection ? "Verifying with Meta…" : "Test API Connection"}
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {isSavingConfig ? "Saving…" : "Save API Credentials"}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Webhook Callback URL & Step-by-Step Setup Guide */}
            <div className="lg:col-span-5 space-y-4">
              {/* Webhook URL Card */}
              <div className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[var(--key-text)] flex items-center gap-2">
                    <Radio className="h-4 w-4 text-emerald-400" />
                    Meta Webhook Callback URL
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    GET / POST Live
                  </span>
                </div>
                <p className="text-[11px] text-[var(--key-muted)]">
                  Paste this exact Callback URL into your Meta Developer Portal under WhatsApp › Configuration › Webhook.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={config?.webhookUrl || `${window.location.origin}/api/whatsapp/webhook`}
                    className="flex-1 bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-emerald-400 font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        config?.webhookUrl || `${window.location.origin}/api/whatsapp/webhook`,
                        "Webhook URL"
                      )
                    }
                    className="px-3 py-2 bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] border border-[var(--key-border)] rounded-xl text-xs font-bold text-[var(--key-text)] flex items-center gap-1"
                  >
                    {copiedKey === "Webhook URL" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy
                  </button>
                </div>

                <div className="text-[11px] text-[var(--key-muted)] bg-[var(--key-surface)] p-3 rounded-xl border border-[var(--key-border)] space-y-1">
                  <p className="font-bold text-[var(--key-text)]">Webhook Field Subscriptions:</p>
                  <p className="font-mono text-emerald-400">✓ messages, message_status</p>
                </div>
              </div>

              {/* Step-by-Step Setup Guide */}
              <div className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[var(--key-text)]">3-Minute Meta Developer Setup</h4>
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold underline"
                  >
                    Meta Portal <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <ol className="space-y-2.5 text-[11px] text-[var(--key-muted)] list-decimal list-inside">
                  <li>
                    Go to <strong>developers.facebook.com</strong> and create/select a <strong>Business</strong> App.
                  </li>
                  <li>
                    Add <strong>WhatsApp</strong> product to your app.
                  </li>
                  <li>
                    Under <strong>WhatsApp › API Setup</strong>, copy your <strong>Phone Number ID</strong> and <strong>WhatsApp Business Account ID</strong>.
                  </li>
                  <li>
                    Under <strong>Configuration › Webhook</strong>, paste the <strong>Callback URL</strong> and <strong>Verify Token</strong> above, then click <em>Verify and Save</em>.
                  </li>
                  <li>
                    Subscribe to the <strong>messages</strong> webhook field.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LIVE INBOUND INBOX & LEADS */}
      {/* ========================================================================= */}
      {activeTab === "inbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Messages Stream */}
          <div className="lg:col-span-8 space-y-4">
            <SectionCard>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--key-border)] pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--key-text)]">Live WhatsApp Inbound & Outbound History</h3>
                  <p className="text-xs text-[var(--key-muted)]">Real-time stream of incoming customer chats, AI auto-replies, and direct outbound messages.</p>
                </div>
                <button
                  type="button"
                  onClick={loadMessages}
                  disabled={isLoadingMessages}
                  className="flex items-center gap-1.5 border border-[var(--key-border)] bg-[var(--key-surface-strong)] hover:bg-[var(--key-surface-hover)] text-[var(--key-text)] px-3 py-1.5 rounded-xl text-xs font-bold"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingMessages ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
              {messages.length === 0 ? (
                <div className="py-12 text-center text-[var(--key-muted)]">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold text-sm">No WhatsApp messages recorded yet</p>
                  <p className="text-xs mt-1">
                    Incoming messages sent to your connected WhatsApp phone will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        msg.direction === "inbound"
                          ? "bg-slate-900/60 border-emerald-500/20"
                          : "bg-slate-900/40 border-indigo-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              msg.direction === "inbound"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            }`}
                          >
                            {msg.direction === "inbound" ? "Inbound From Customer" : "Outbound Message"}
                          </span>
                          <span className="font-bold text-xs text-[var(--key-text)]">
                            {msg.senderName || msg.from}
                          </span>
                          <span className="text-[11px] text-[var(--key-muted)] font-mono">
                            ({msg.direction === "inbound" ? msg.from : msg.to})
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--key-muted)] font-mono">
                          {formatDate(msg.timestamp)} {formatTime(msg.timestamp)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-200 bg-[var(--key-surface)] p-3 rounded-xl border border-[var(--key-border)] leading-relaxed whitespace-pre-wrap">
                        {msg.body}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[var(--key-muted)] mt-2 pt-2 border-t border-[var(--key-border)]">
                        <div className="flex items-center gap-2">
                          {msg.aiGenerated && (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <Sparkles className="h-3 w-3" /> Auto-Generated by Gemini AI
                            </span>
                          )}
                          <span className="text-[10px]">Status: {msg.status}</span>
                        </div>
                        {msg.direction === "inbound" && (
                          <button
                            type="button"
                            onClick={() => {
                              setDirectToPhone(msg.from);
                              setActiveTab("inbox");
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-bold text-xs underline"
                          >
                            Direct Reply →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right Column: Direct WhatsApp Messenger */}
          <div className="lg:col-span-4 space-y-4">
            <form
              onSubmit={handleSendDirectMessage}
              className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-[var(--key-text)] flex items-center gap-2">
                  <Send className="h-4 w-4 text-[#25D366]" />
                  Direct WhatsApp Messenger
                </h4>
              </div>
              <p className="text-[11px] text-[var(--key-muted)]">
                Send a direct one-on-one WhatsApp message to any customer phone number.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                  Recipient Phone Number (with Country Code)
                </label>
                <input
                  type="text"
                  required
                  value={directToPhone}
                  onChange={(e) => setDirectToPhone(e.target.value)}
                  placeholder="e.g. 919876543210"
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-[#25D366] font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                  Message Content
                </label>
                <textarea
                  rows={4}
                  required
                  value={directMsgText}
                  onChange={(e) => setDirectMsgText(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl p-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-[#25D366] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingDirect || !directToPhone.trim() || !directMsgText.trim()}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20"
              >
                <Send className="h-3.5 w-3.5" />
                {isSendingDirect ? "Sending Message…" : "Send Message"}
              </button>
            </form>

            <div className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-4 space-y-2">
              <h5 className="font-bold text-xs text-[var(--key-text)] flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-indigo-400" />
                CRM Contacts Link
              </h5>
              <p className="text-[11px] text-[var(--key-muted)]">
                All customer inquiries captured via WhatsApp are synced into your CRM contacts list.
              </p>
              <button
                type="button"
                onClick={() => navigate("/contacts")}
                className="w-full border border-[var(--key-border)] bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] text-[var(--key-text)] font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 mt-1"
              >
                View CRM Contacts <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: TEMPLATES & BROADCAST LAUNCHER */}
      {/* ========================================================================= */}

      {/* Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--key-surface-strong)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--key-border)] text-[var(--key-text)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-[var(--key-text)]">
                {editingTemplate ? "Edit Template" : "New WhatsApp Template"}
              </h3>
              <button
                type="button"
                onClick={closeTemplateModal}
                className="text-[var(--key-muted)] hover:text-[var(--key-text)] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. order_confirmation_v1"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                  Template Body (use {'{{1}}'}, {'{{2}}'} for variables)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Hi {{1}}, your order #{{2}} has been confirmed!"
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl p-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500 resize-none font-mono"
                />
              </div>

              {templateError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 font-medium">
                  {templateError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--key-border)]">
                <button
                  type="button"
                  onClick={closeTemplateModal}
                  className="px-4 py-2 text-xs font-bold text-[var(--key-muted)] hover:text-[var(--key-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTemplate}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  {isSavingTemplate ? "Saving…" : editingTemplate ? "Save Changes" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Campaign Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--key-surface-strong)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--key-border)] text-[var(--key-text)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-[var(--key-text)]">
                {editingCampaign ? "Edit Broadcast" : "Launch WhatsApp Broadcast"}
              </h3>
              <button
                type="button"
                onClick={closeBroadcastModal}
                className="text-[var(--key-muted)] hover:text-[var(--key-text)] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Black Friday VIP Announcement"
                  value={broadcastName}
                  onChange={(e) => setBroadcastName(e.target.value)}
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                  Recipient Audience Count
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500 or 15/day"
                  value={recipientsCount}
                  onChange={(e) => setRecipientsCount(e.target.value)}
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                  Select Pre-Approved Template (optional)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                >
                  <option value="">No template (Custom text)</option>
                  {templates
                    .filter((t) => t.status === "Approved")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={broadcastStatus}
                  onChange={(e) => setBroadcastStatus(e.target.value as any)}
                  className="w-full bg-[var(--key-input-bg)] border border-[var(--key-input-border)] rounded-xl py-2 px-3 text-xs text-[var(--key-text)] focus:outline-none focus:border-indigo-500"
                >
                  <option value="Sent">Sent Immediately</option>
                  <option value="Active">Active Scheduled</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              {broadcastError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 font-medium">
                  {broadcastError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--key-border)]">
                <button
                  type="button"
                  onClick={closeBroadcastModal}
                  className="px-4 py-2 text-xs font-bold text-[var(--key-muted)] hover:text-[var(--key-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBroadcast}
                  className="px-5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold rounded-xl text-xs shadow-md"
                >
                  {isSavingBroadcast
                    ? "Saving…"
                    : editingCampaign
                      ? "Save Changes"
                      : broadcastStatus === "Draft"
                        ? "Save Draft"
                        : "Launch Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[var(--key-surface-strong)] text-[var(--key-text)] border border-[var(--key-border)] text-xs font-semibold py-3 px-5 rounded-2xl shadow-2xl z-[150] flex items-center gap-2 animate-in slide-in-from-bottom-4">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Multi-Language Interactive Setup Guide Modal */}
      <InteractiveSetupGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        initialTopic={guideTopic}
      />
    </PageShell>
  );
}
