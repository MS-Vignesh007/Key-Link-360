import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  Smartphone,
  Globe,
  QrCode,
  Link2,
  Shuffle,
  Contact as ContactIcon,
  Activity,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Eye,
  Lock,
  Unlock,
  Server,
  Cpu,
  Layers,
  ExternalLink,
  ChevronRight,
  Sparkles,
  BarChart3,
  X
} from "lucide-react";
import { UserProfile, ScreenId } from "../types";
import { getAccessToken } from "../lib/authApi";

interface SuperAdminScreenProps {
  user: UserProfile | null;
  onNavigate: (screen: ScreenId) => void;
}

interface OverviewMetrics {
  users: { total: number; active: number; inactive: number; blocked: number; new7d: number };
  pages: { total: number; live: number; draft: number; totalViews: number };
  domains: { total: number; connected: number; platformSubdomains: number };
  qrCodes: { total: number; active: number; totalScans: number };
  shortLinks: { total: number; totalClicks: number };
  rotators: { total: number; active: number };
  leads: { totalContacts: number };
  events: { total: number; visits: number; clicks: number; registrations: number; purchases: number };
  payments: { totalOrders: number; paidOrders: number; totalRevenueInr: number };
}

interface SubOwnerUser {
  id: string;
  email: string;
  role: string;
  name: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  businessName?: string;
  phone?: string;
  country?: string;
  avatarUrl?: string;
  plan: string;
  status: "active" | "inactive" | "blocked" | "deleted";
  isVerified: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  stats: {
    pagesCount: number;
    livePagesCount: number;
    qrCount: number;
    shortLinksCount: number;
    rotatorsCount: number;
    contactsCount: number;
    domainsCount: number;
  };
}

interface TenantDetails {
  user: SubOwnerUser;
  pages: Array<{ id: string; title: string; slug: string; status: string; views: number; createdAt: string }>;
  qrCodes: Array<{ id: string; name: string; publicCode: string; targetUrl: string; scans: string; status: string }>;
  shortLinks: Array<{ id: string; title: string; slug: string; destinationUrl: string; clicks: number; status: string }>;
  rotators: Array<{ id: string; name: string; slug: string; destinationsCount: number; status: string }>;
  domains: Array<{ id: string; domainName: string; pageId: string; status: string; type: string }>;
  contactsCount: number;
}

interface SystemHealth {
  status: string;
  timestamp: string;
  server: {
    nodeVersion: string;
    platform: string;
    uptimeSec: number;
    memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
  };
  services: {
    database: { backend: string; supabaseConfigured: boolean; status: string };
    cloudflareSaas: { configured: boolean; aRecordTarget: string; cnameTarget: string; status: string };
    razorpay: { configured: boolean; keyId: string | null; status: string };
    smtp: { configured: boolean; status: string };
  };
}

interface PlatformAnalytics {
  totalEvents: number;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  os: Record<string, number>;
  topPages: Array<{ pageId: string; title: string; slug: string; ownerUserId: string; visits: number }>;
  recentEvents: Array<{ id: string; pageId: string; eventType: string; eventLabel: string; device: string; timestamp: string }>;
}

export function SuperAdminScreen({ user, onNavigate }: SuperAdminScreenProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "analytics" | "health">("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [users, setUsers] = useState<SubOwnerUser[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);

  // Sub Owners Table Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  // Selected Tenant Modal
  const [inspectingUserId, setInspectingUserId] = useState<string | null>(null);
  const [inspectingData, setInspectingData] = useState<TenantDetails | null>(null);
  const [inspectingLoading, setInspectingLoading] = useState(false);

  // Status update in-flight
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const isMainOwner = user?.role === "MAIN_OWNER";

  const fetchOverview = async (token: string) => {
    const res = await fetch("/api/admin/overview", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to load overview");
    const data = await res.json();
    setMetrics(data.metrics);
  };

  const fetchUsers = async (token: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (planFilter !== "all") params.set("plan", planFilter);

    const res = await fetch(`/api/admin/users?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to load Sub Owners");
    const data = await res.json();
    setUsers(data.users || []);
  };

  const fetchHealth = async (token: string) => {
    const res = await fetch("/api/admin/health", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to load system health");
    const data = await res.json();
    setHealth(data);
  };

  const fetchAnalytics = async (token: string) => {
    const res = await fetch("/api/admin/analytics", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to load analytics");
    const data = await res.json();
    setAnalytics(data);
  };

  const loadAllData = async (isManualRefresh = false) => {
    const token = getAccessToken();
    if (!token) {
      setError("Authentication token missing.");
      setLoading(false);
      return;
    }

    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchOverview(token),
        fetchUsers(token),
        fetchHealth(token),
        fetchAnalytics(token)
      ]);
    } catch (err: any) {
      setError(err.message || "Failed to load platform data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isMainOwner) {
      loadAllData();
    }
  }, [isMainOwner]);

  useEffect(() => {
    if (isMainOwner && !loading) {
      const token = getAccessToken();
      if (token) fetchUsers(token);
    }
  }, [searchQuery, statusFilter, planFilter]);

  const handleInspectUser = async (userId: string) => {
    const token = getAccessToken();
    if (!token) return;
    setInspectingUserId(userId);
    setInspectingLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch tenant details");
      const data = await res.json();
      setInspectingData(data);
    } catch (err: any) {
      alert("Error inspecting tenant: " + err.message);
      setInspectingUserId(null);
    } finally {
      setInspectingLoading(false);
    }
  };

  const handleToggleStatus = async (targetUser: SubOwnerUser) => {
    const newStatus = targetUser.status === "active" ? "blocked" : "active";
    const confirmMsg =
      newStatus === "blocked"
        ? `Are you sure you want to suspend Sub Owner "${targetUser.email}"? All active sessions will be terminated.`
        : `Re-activate Sub Owner "${targetUser.email}"?`;

    if (!window.confirm(confirmMsg)) return;

    const token = getAccessToken();
    if (!token) return;

    setUpdatingStatusId(targetUser.id);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u))
      );
      if (inspectingData && inspectingData.user.id === targetUser.id) {
        setInspectingData({ ...inspectingData, user: { ...inspectingData.user, status: newStatus } });
      }
    } catch (err: any) {
      alert("Status update failed: " + err.message);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (!isMainOwner) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Access Denied (403 Forbidden)</h1>
        <p className="text-slate-400 max-w-md mb-6">
          The Control Center is restricted to KEYLINK360 Main Owners. Normal Sub Owner accounts cannot access platform administration.
        </p>
        <button
          onClick={() => onNavigate(ScreenId.DASHBOARD)}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 transition-all"
        >
          Return to My Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 key-main-scroll p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-indigo-950/40 border border-amber-500/20 p-6 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Main Owner Control Center
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Platform Master Administration
            </h1>
            <p className="text-sm text-slate-400">
              Govern registered Sub Owners, inspect tenant properties, monitor edge DNS routing, and review global traffic.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAllData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
              {refreshing ? "Refreshing…" : "Sync Now"}
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          {[
            { id: "overview", label: "Platform Overview", icon: Layers },
            { id: "users", label: `Sub Owners (${users.length})`, icon: Users },
            { id: "analytics", label: "Global Analytics", icon: BarChart3 },
            { id: "health", label: "System Health", icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  active
                    ? "bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: PLATFORM OVERVIEW */}
      {activeTab === "overview" && metrics && (
        <div className="space-y-6">
          {/* Main KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Registered Sub Owners</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metrics.users.total}</div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-emerald-400 font-medium">{metrics.users.active} active</span>
                <span>•</span>
                <span className="text-amber-400 font-medium">{metrics.users.new7d} new (7d)</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Bio Pages</span>
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metrics.pages.total}</div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-emerald-400 font-medium">{metrics.pages.live} Live published</span>
                <span>•</span>
                <span>{metrics.pages.totalViews} views</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Custom Domains</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metrics.domains.total}</div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-emerald-400 font-medium">{metrics.domains.connected} verified</span>
                <span>•</span>
                <span>{metrics.domains.platformSubdomains} free slugs</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Leads Collected</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ContactIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metrics.leads.totalContacts}</div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-indigo-400 font-medium">{metrics.events.registrations} form leads</span>
              </div>
            </div>
          </div>

          {/* Secondary Marketing Assets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <QrCode className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-slate-300">Smart QR Codes</span>
              </div>
              <div className="text-2xl font-bold text-white">{metrics.qrCodes.total}</div>
              <div className="text-xs text-slate-400 mt-1">{metrics.qrCodes.totalScans} lifetime scans</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <Link2 className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-slate-300">Short Links</span>
              </div>
              <div className="text-2xl font-bold text-white">{metrics.shortLinks.total}</div>
              <div className="text-xs text-slate-400 mt-1">{metrics.shortLinks.totalClicks} clicks redirected</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <Shuffle className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium text-slate-300">Link Rotators</span>
              </div>
              <div className="text-2xl font-bold text-white">{metrics.rotators.total}</div>
              <div className="text-xs text-slate-400 mt-1">{metrics.rotators.active} active A/B splits</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">Payments Processed</span>
              </div>
              <div className="text-2xl font-bold text-white">₹{metrics.payments.totalRevenueInr.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-1">{metrics.payments.paidOrders} confirmed orders</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUB OWNERS DIRECTORY */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center gap-3 justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Sub Owners by email, name, or company…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="blocked">Suspended Only</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Plans</option>
                <option value="Free Plan">Free Plan</option>
                <option value="Pro Business">Pro Business</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Sub Owner</th>
                  <th className="px-5 py-3.5">Role / Plan</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Digital Assets</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No Sub Owners matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((subOwner) => {
                    const isSelf = subOwner.id === user?.email || subOwner.role === "MAIN_OWNER";
                    return (
                      <tr key={subOwner.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={subOwner.avatarUrl || "https://tapback.co/api/avatar/key.webp"}
                              alt={subOwner.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <div className="font-medium text-slate-100 flex items-center gap-1.5">
                                {subOwner.name}
                                {subOwner.role === "MAIN_OWNER" && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                                    OWNER
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-mono">{subOwner.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                              {subOwner.plan}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              subOwner.status === "active"
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                                : subOwner.status === "blocked"
                                ? "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                                : "bg-slate-700/30 text-slate-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                subOwner.status === "active"
                                  ? "bg-emerald-400"
                                  : subOwner.status === "blocked"
                                  ? "bg-rose-400"
                                  : "bg-slate-400"
                              }`}
                            />
                            {subOwner.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                            <span title="Pages" className="text-pink-400">{subOwner.stats.pagesCount}p</span>
                            <span>•</span>
                            <span title="QR Codes" className="text-purple-400">{subOwner.stats.qrCount}qr</span>
                            <span>•</span>
                            <span title="Links" className="text-blue-400">{subOwner.stats.shortLinksCount}l</span>
                            <span>•</span>
                            <span title="Leads" className="text-emerald-400">{subOwner.stats.contactsCount}leads</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-400">
                          {new Date(subOwner.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleInspectUser(subOwner.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Inspect
                            </button>

                            {!isSelf && (
                              <button
                                onClick={() => handleToggleStatus(subOwner)}
                                disabled={updatingStatusId === subOwner.id}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1 ${
                                  subOwner.status === "active"
                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                                }`}
                              >
                                {subOwner.status === "active" ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5" /> Suspend
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3.5 h-3.5" /> Activate
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL ANALYTICS */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Device Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.devices).map(([dev, count]) => {
                  const pct = Math.round((count / (analytics.totalEvents || 1)) * 100);
                  return (
                    <div key={dev}>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>{dev}</span>
                        <span className="font-mono">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Browser Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.browsers).slice(0, 5).map(([b, count]) => {
                  const pct = Math.round((count / (analytics.totalEvents || 1)) * 100);
                  return (
                    <div key={b}>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>{b}</span>
                        <span className="font-mono">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Operating Systems
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.os).slice(0, 5).map(([os, count]) => {
                  const pct = Math.round((count / (analytics.totalEvents || 1)) * 100);
                  return (
                    <div key={os}>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>{os}</span>
                        <span className="font-mono">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Visited Pages Leaderboard */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Top Visited Bio Pages (Platform Leaderboard)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/40 text-xs font-semibold text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Rank</th>
                    <th className="px-4 py-2.5">Bio Page Title</th>
                    <th className="px-4 py-2.5">Slug</th>
                    <th className="px-4 py-2.5">Owner User ID</th>
                    <th className="px-4 py-2.5 text-right">Total Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analytics.topPages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        No page visit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    analytics.topPages.map((page, idx) => (
                      <tr key={page.pageId}>
                        <td className="px-4 py-3 font-mono text-amber-400 font-bold">#{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-100">{page.title}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{page.slug || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{page.ownerUserId}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400">{page.visits}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM HEALTH */}
      {activeTab === "health" && health && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database Service */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Server className="w-6 h-6 text-indigo-400" />
                  <div>
                    <h3 className="font-semibold text-slate-100">Primary Database</h3>
                    <p className="text-xs text-slate-400">PostgreSQL / Supabase Persistent Store</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  {health.services.database.status}
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-400 font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>Backend Mode: <span className="text-slate-200">{health.services.database.backend.toUpperCase()}</span></div>
                <div>Supabase Configured: <span className="text-slate-200">{String(health.services.database.supabaseConfigured)}</span></div>
              </div>
            </div>

            {/* Cloudflare SaaS */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h3 className="font-semibold text-slate-100">Cloudflare for SaaS</h3>
                    <p className="text-xs text-slate-400">Custom Hostnames & Automated SSL</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  health.services.cloudflareSaas.configured
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                }`}>
                  {health.services.cloudflareSaas.status}
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-400 font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>A Record Target: <span className="text-slate-200">{health.services.cloudflareSaas.aRecordTarget}</span></div>
                <div>CNAME Target: <span className="text-slate-200">{health.services.cloudflareSaas.cnameTarget}</span></div>
              </div>
            </div>

            {/* Razorpay Payments */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="font-semibold text-slate-100">Razorpay Payment Gateway</h3>
                    <p className="text-xs text-slate-400">UPI / Card Transactions</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  {health.services.razorpay.status}
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-400 font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>Public Key ID: <span className="text-slate-200">{health.services.razorpay.keyId || "Not Set"}</span></div>
                <div>HMAC Signature Validation: <span className="text-emerald-400">Enforced (SHA-256)</span></div>
              </div>
            </div>

            {/* Server Process & Memory */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Cpu className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-slate-100">Server Runtime</h3>
                    <p className="text-xs text-slate-400">Node.js Process Metrics</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  ONLINE ({Math.floor(health.server.uptimeSec / 60)}m uptime)
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-400 font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>Node Version: <span className="text-slate-200">{health.server.nodeVersion}</span> ({health.server.platform})</div>
                <div>Memory RSS: <span className="text-slate-200">{health.server.memory.rssMb} MB</span> (Heap: {health.server.memory.heapUsedMb} MB / {health.server.memory.heapTotalMb} MB)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TENANT DETAILS INSPECTOR */}
      {inspectingUserId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">
                    {inspectingData?.user.name || "Inspecting Sub Owner"}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">{inspectingData?.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setInspectingUserId(null);
                  setInspectingData(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {inspectingLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <span className="w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                  <p className="text-xs">Loading tenant digital assets…</p>
                </div>
              ) : inspectingData ? (
                <>
                  {/* Summary Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Bio Pages</div>
                      <div className="text-xl font-bold text-pink-400">{inspectingData.pages.length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">QR Codes</div>
                      <div className="text-xl font-bold text-purple-400">{inspectingData.qrCodes.length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Short Links</div>
                      <div className="text-xl font-bold text-blue-400">{inspectingData.shortLinks.length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Leads Captured</div>
                      <div className="text-xl font-bold text-emerald-400">{inspectingData.contactsCount}</div>
                    </div>
                  </div>

                  {/* Bio Pages Owned */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Bio Pages Owned ({inspectingData.pages.length})
                    </h4>
                    {inspectingData.pages.length === 0 ? (
                      <p className="text-xs text-slate-500">No pages created by this tenant yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {inspectingData.pages.map((p) => (
                          <div
                            key={p.id}
                            className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-medium text-slate-200">{p.title}</div>
                              <div className="font-mono text-slate-400">{p.slug}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  p.status === "Live"
                                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                                    : "bg-slate-700/30 text-slate-400"
                                }`}
                              >
                                {p.status}
                              </span>
                              <span className="text-slate-400 font-mono">{p.views} views</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* QR Codes Owned */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Smart QR Codes Owned ({inspectingData.qrCodes.length})
                    </h4>
                    {inspectingData.qrCodes.length === 0 ? (
                      <p className="text-xs text-slate-500">No QR codes created by this tenant.</p>
                    ) : (
                      <div className="space-y-2">
                        {inspectingData.qrCodes.map((q) => (
                          <div
                            key={q.id}
                            className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-medium text-slate-200">{q.name}</div>
                              <div className="font-mono text-slate-400">Target: {q.targetUrl}</div>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-slate-300">
                              <span>Code: {q.publicCode}</span>
                              <span>•</span>
                              <span className="text-purple-400">{q.scans} scans</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => {
                  setInspectingUserId(null);
                  setInspectingData(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SuperAdminScreen;
