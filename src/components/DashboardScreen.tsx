import React, { useMemo, useState } from "react";
import { ScreenId, BioPage, UserProfile } from "../types";
import { Smartphone, Link2, QrCode, FileText, ArrowRight, Bot, Sparkles, BookOpen } from "lucide-react";
import InteractiveSetupGuideModal from "./guides/InteractiveSetupGuideModal";
import PageShell, { StatCard, StatCardGrid, Workspace } from "./layout/PageShell";
import { useLanguage } from "../lib/languageContext";

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onOpenPage: (pageId: string) => void;
  user: UserProfile;
  metrics: {
    totalClicks: number;
    pageViews: number;
    activeLinks: number;
    activePages: number;
    totalRegisters?: number;
    events?: any[];
  };
  pages: BioPage[];
}

type AnalyticsEvent = {
  id?: string;
  eventType?: string;
  eventLabel?: string;
  timestamp?: string;
  device?: string;
  os?: string;
  browser?: string;
  port?: string;
  domain?: string;
};

const ranges = ["7D", "30D", "90D", "All"] as const;
type TimeRange = (typeof ranges)[number];

function getRangeStart(range: TimeRange): number | null {
  if (range === "All") return null;
  const days = Number.parseInt(range, 10);
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

export default function DashboardScreen({ onNavigate, onOpenPage, user, metrics, pages }: DashboardScreenProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30D");
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const { t, tr, language } = useLanguage();
  const eventsList = (metrics.events || []) as AnalyticsEvent[];
  const rangeStart = getRangeStart(timeRange);
  const filteredEvents = useMemo(
    () =>
      rangeStart === null
        ? eventsList
        : eventsList.filter((event) => {
            const timestamp = new Date(event.timestamp || "").getTime();
            return Number.isFinite(timestamp) && timestamp >= rangeStart;
          }),
    [eventsList, rangeStart]
  );
  const hasEventHistory = eventsList.length > 0;
  const rangeMetrics = {
    views: hasEventHistory
      ? filteredEvents.filter((event) => event.eventType === "visit").length
      : metrics.pageViews,
    clicks: hasEventHistory
      ? filteredEvents.filter((event) => event.eventType === "click").length
      : metrics.totalClicks,
    registers: hasEventHistory
      ? filteredEvents.filter((event) => event.eventType === "register").length
      : metrics.totalRegisters || 0
  };
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return { date, clicks: 0, label: date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase() };
    });

    filteredEvents.forEach((event) => {
      if (event.eventType !== "click") return;
      const timestamp = new Date(event.timestamp || "");
      const bucket = days.find((day) => day.date.toDateString() === timestamp.toDateString());
      if (bucket) bucket.clicks += 1;
    });
    return days;
  }, [filteredEvents]);
  const maxChartValue = Math.max(1, ...chartData.map((day) => day.clicks));

  const quickAccess = [
    {
      id: ScreenId.BIO_PAGES,
      label: t("nav.bio_pages", "Bio Pages"),
      sub: language === "ta" ? "லேண்டிங் பக்கங்கள் உருவாக்கு" : "Build landing pages",
      icon: Smartphone,
      color: "from-indigo-50 to-indigo-100/50",
      iconColor: "text-indigo-600",
      bgHover: "hover:border-indigo-300 hover:shadow-indigo-100/40"
    },
    {
      id: ScreenId.LINKS,
      label: t("nav.links", "Links"),
      sub: language === "ta" ? "ஸ்மார்ட் குறுக்கு URLs" : "Smart short URLs",
      icon: Link2,
      color: "from-indigo-50 to-indigo-100/50",
      iconColor: "text-indigo-600",
      bgHover: "hover:border-indigo-300 hover:shadow-indigo-100/40"
    },
    {
      id: ScreenId.QR_CODES,
      label: t("nav.qr_codes", "QR Codes"),
      sub: language === "ta" ? "உருவாக்கு & கண்காணி" : "Generate & track",
      icon: QrCode,
      color: "from-indigo-50 to-indigo-100/50",
      iconColor: "text-indigo-600",
      bgHover: "hover:border-indigo-300 hover:shadow-indigo-100/40"
    },
    {
      id: ScreenId.TEMPLATES,
      label: t("nav.templates", "Templates"),
      sub: language === "ta" ? "மாதிரி வடிவமைப்புகள்" : "Ready-made designs",
      icon: FileText,
      color: "from-indigo-50 to-indigo-100/50",
      iconColor: "text-indigo-600",
      bgHover: "hover:border-indigo-300 hover:shadow-indigo-100/40"
    }
  ];

  return (
    <PageShell>
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="key-page-title text-2xl sm:text-3xl flex flex-wrap items-center gap-x-2 gap-y-1">
            {t("dash.welcome_back", "Welcome back,")} <span className="text-indigo-600">{user.name.split(/\s+/)[0] || "there"}</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {hasEventHistory
              ? `${t("dash.visitor_activity", "Showing visitor activity.")} (${timeRange === "All" ? "All" : `Last ${timeRange}`})`
              : language === "ta" ? "பார்வையாளர்கள் பக்கங்களை பார்வையிடும் போது விவரங்கள் இங்கு தோன்றும்." : "Your activity will appear here as soon as visitors interact with your pages."}
          </p>
        </div>

        {/* Time filters matching the geometric theme */}
        <div className="key-segment-control self-start md:self-auto">
          {ranges.map((range) => {
            const isSelected = range === timeRange;
            return (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                aria-pressed={isSelected}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Multilingual Setup Guides Banner */}
      <div
        className="bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-lg mb-6"
        data-aos="fade-up"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center border border-indigo-500/30 shrink-0 shadow-sm">
              <Bot className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base sm:text-lg text-[var(--key-text)]">
                  {t("dash.interactive_guides", "Interactive Setup Guides & Documentation")}
                </h4>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
                  EN / தமிழ் / हिन्दी
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--key-muted)]">
                {language === "ta"
                  ? "Bio AI Sales Agent, Meta WhatsApp Cloud API, மற்றும் 1-Click QR Bot அமைப்புகளுக்கான விரிவான நேரடி செயல்முறை வழிகாட்டிகள்."
                  : "Step-by-step visual tutorials with screenshot mockups for Bio AI Sales Agent (Gemini 1.5 Free), Meta WhatsApp Cloud API, and 1-Click QR Bot."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsGuideModalOpen(true)}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-2 shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            <span>{t("dash.explore_guides", "Explore Visual Guides →")}</span>
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div data-aos="fade-up">
        <StatCardGrid>
          <StatCard
            label={t("dash.total_views", "Total Views")}
            value={rangeMetrics.views.toLocaleString()}
            sub={hasEventHistory ? `${timeRange} visitor activity` : "Live impression count"}
          />
          <StatCard
            label={t("dash.total_clicks", "Total Clicks")}
            value={rangeMetrics.clicks.toLocaleString()}
            sub={hasEventHistory ? `${timeRange} click activity` : "Dynamic click logs"}
          />
          <StatCard
            label={t("dash.registrations", "Registrations")}
            value={rangeMetrics.registers.toLocaleString()}
            sub={hasEventHistory ? `${timeRange} form submissions` : "New leads form submissions"}
          />
          <StatCard
            label={t("dash.active_pages", "Active Bio Pages")}
            value={metrics.activePages.toLocaleString()}
            sub={`${metrics.activePages} page(s) live`}
          />
        </StatCardGrid>
      </div>

      {/* Main Visual Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 key-workspace-grid" data-aos="fade-up" data-aos-delay="100">
        {/* Click Performance Graph */}
        <Workspace className="lg:col-span-8 key-section-card flex flex-col relative overflow-hidden min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h3 className="font-bold text-[var(--key-text)]">{t("dash.click_performance", "Click Performance")}</h3>
            <div className="key-segment-control self-start" aria-label="Traffic date range">
              {ranges.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  aria-pressed={timeRange === range}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {hasEventHistory ? (
            <div className="mb-4 text-left">
              <p className="text-sm font-semibold text-indigo-500">
                ✨ Live Real-Time Activity Tracking Enabled
              </p>
              <p className="text-xs text-[var(--key-muted)] mt-1">
                {filteredEvents.length} action{filteredEvents.length === 1 ? "" : "s"} in the selected range.
              </p>
            </div>
          ) : (
            <div className="mb-4 text-left">
              <p className="text-sm font-medium text-[var(--key-muted)]">Awaiting your first clicks</p>
              <p className="text-xs text-[var(--key-muted)] opacity-80 mt-1">
                Click metrics will plot automatically as soon as users visit your active links.
              </p>
            </div>
          )}
          
          <div className="flex-1 flex items-end justify-between px-2 gap-2 sm:gap-4 h-48 relative border-b border-[var(--key-border)]" role="img" aria-label="Clicks by day for the past seven days">
            {chartData.map((day) => (
              <div key={day.date.toISOString()} className="flex-1 h-full rounded-t-lg bg-[var(--key-bg-soft)] relative group flex items-end">
                <div
                  className="w-full rounded-t-md bg-indigo-500 transition-[height] duration-300 group-hover:bg-indigo-600"
                  style={{ height: `${(day.clicks / maxChartValue) * 100}%`, minHeight: day.clicks ? "4px" : "2px" }}
                />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 hidden rounded bg-[var(--key-surface-strong)] px-1.5 py-0.5 text-[10px] text-[var(--key-text)] border border-[var(--key-border)] group-hover:block shadow-md">
                  {day.clicks} click{day.clicks === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-4 text-[10px] text-[var(--key-muted)] font-bold">
            {chartData.map((day) => <span key={day.date.toISOString()}>{day.label}</span>)}
          </div>
        </Workspace>

        {/* Recent Activity / Top Bio Pages */}
        <Workspace className="lg:col-span-4 key-section-card flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-bold text-[var(--key-text)] mb-6">{t("dash.top_pages", "Top Bio Pages")}</h3>
            <div className="space-y-4">
              {pages.length === 0 ? (
                <div className="text-center py-12 text-[var(--key-muted)] text-xs">
                  <p>No bio pages created yet.</p>
                </div>
              ) : (
                pages.slice(0, 3).map((page) => {
                  const titleWords = page.title.split(" ");
                  const initials = titleWords.map(w => w[0]).join("").slice(0, 2).toUpperCase() || "BP";
                  return (
                    <button
                      type="button"
                      key={page.id}
                      onClick={() => onOpenPage(page.id)}
                      className="flex w-full items-center p-3 rounded-xl border border-[var(--key-border)] bg-[var(--key-bg-deep)]/40 hover:bg-[var(--key-bg-soft)] transition-colors text-left"
                      aria-label={`Open ${page.title}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shrink-0 mr-3 flex items-center justify-center text-white font-black text-xs shadow-sm">{initials}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate text-[var(--key-text)]">{page.title}</div>
                        <div className="text-xs text-[var(--key-muted)] truncate">{page.slug}</div>
                      </div>
                      <div className="ml-auto text-xs font-bold text-[var(--key-text)] bg-[var(--key-bg-soft)] px-2.5 py-1 rounded-full border border-[var(--key-border)]">{page.views}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(ScreenId.BIO_PAGES)}
            className="mt-6 w-full py-2.5 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-colors border border-indigo-500/20 btn-anim btn-swipe-secondary"
          >
            <span>{t("common.view_all", "View All Pages")}</span>
          </button>
        </Workspace>
      </div>

      {/* Visitor Session & Event Activity Log Table */}
      <Workspace className="key-section-card min-w-0" data-aos="fade-up" data-aos-delay="150">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-[var(--key-text)] text-base sm:text-lg">Real-Time Traffic & Action Tracker</h3>
            <p className="text-xs text-[var(--key-muted)]">Track which domain, client ports, devices, OS, and actions users perform globally.</p>
          </div>
          <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Connection
          </span>
        </div>

        <div className="overflow-x-auto border border-[var(--key-border)] rounded-xl">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-[var(--key-muted)] text-xs">
              <p className="font-semibold text-[var(--key-text)] mb-1">
                {hasEventHistory ? "No activity in this date range" : "🔍 Waiting for your first live session"}
              </p>
              <p className="text-[var(--key-muted)] opacity-80 leading-normal max-w-md mx-auto">
                {hasEventHistory
                  ? "Choose a longer date range to see earlier visitor activity."
                  : 'Scan the QR code of any BioPage using a mobile device, or click "Open visit" in the editor on your laptop. Real-time details will appear here instantly!'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--key-bg-soft)] border-b border-[var(--key-border)] text-[var(--key-muted)] font-bold font-mono">
                  <th className="p-3.5">Action & Label</th>
                  <th className="p-3.5">Device Profile</th>
                  <th className="p-3.5">Network Ports</th>
                  <th className="p-3.5">Host Domain</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--key-border)]">
                {filteredEvents.slice(0, 10).map((event, index) => {
                  let badgeColor = "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
                  if (event.eventType === "click") badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                  if (event.eventType === "register") badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";

                  return (
                    <tr key={event.id || `${event.timestamp || "event"}-${index}`} className="hover:bg-[var(--key-bg-soft)]/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                            {(event.eventType || "visit").toUpperCase()}
                          </span>
                          <span className="font-semibold text-[var(--key-text)] truncate max-w-[180px]">
                            {event.eventLabel || "Page Visit"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="font-bold text-[var(--key-text)] flex items-center gap-1">
                            <span>{event.device === "Mobile" ? "📱" : event.device === "Tablet" ? "📟" : "💻"}</span>
                            <span>{event.device} ({event.os})</span>
                          </div>
                          <div className="text-[10px] text-[var(--key-muted)] font-mono">{event.browser} Browser</div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-[var(--key-muted)]">
                        {event.port || "N/A"}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-[11px] font-mono">
                          {event.domain || "key.link"}
                        </span>
                      </td>
                      <td className="p-3.5 text-[var(--key-muted)] font-mono">
                        {event.timestamp
                          ? new Date(event.timestamp).toLocaleTimeString()
                          : "Unknown"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Workspace>

      {/* Quick Access Area */}
      <div className="space-y-4" data-aos="fade-up" data-aos-delay="200">
        <h3 className="key-page-title text-lg">
          Quick Access
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickAccess.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                type="button"
                key={qa.id}
                onClick={() => onNavigate(qa.id)}
                className="group key-glass-card p-4 sm:p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-indigo-500/40 hover:-translate-y-1 min-w-0"
              >
                <div
                  className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-105 transition-transform"
                >
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <h4 className="font-sans font-semibold text-sm text-[var(--key-text)]">{qa.label}</h4>
                <p className="text-[11px] text-[var(--key-muted)] mt-1">{qa.sub}</p>
                <ArrowRight className="h-3.5 w-3.5 mt-3 text-[var(--key-muted)] group-hover:text-indigo-500 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Language Interactive Setup Guide Modal */}
      <InteractiveSetupGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        initialTopic="bio_ai"
      />
    </PageShell>
  );
}
