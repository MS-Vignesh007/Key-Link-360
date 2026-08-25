import React, { useMemo, useState } from "react";
import { ScreenId, BioPage, UserProfile } from "../types";
import { Smartphone, Link2, QrCode, FileText, ArrowRight } from "lucide-react";
import PageShell, { StatCard, StatCardGrid, Workspace } from "./layout/PageShell";

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
      label: "Bio Pages",
      sub: "Build landing pages",
      icon: Smartphone,
      color: "from-indigo-50 to-indigo-100/50",
      iconColor: "text-indigo-600",
      bgHover: "hover:border-indigo-300 hover:shadow-indigo-100/40"
    },
    {
      id: ScreenId.LINKS,
      label: "Links",
      sub: "Smart short URLs",
      icon: Link2,
      color: "from-indigo-50 to-indigo-100/50",
      iconColor: "text-indigo-600",
      bgHover: "hover:border-indigo-300 hover:shadow-indigo-100/40"
    },
    {
      id: ScreenId.QR_CODES,
      label: "QR Codes",
      sub: "Generate & track",
      icon: QrCode,
      color: "from-indigo-50 to-indigo-100/50",
      iconColor: "text-indigo-600",
      bgHover: "hover:border-indigo-300 hover:shadow-indigo-100/40"
    },
    {
      id: ScreenId.TEMPLATES,
      label: "Templates",
      sub: "Ready-made designs",
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
            Welcome back, <span className="text-indigo-600">{user.name.split(/\s+/)[0] || "there"}</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {hasEventHistory
              ? `Showing ${timeRange === "All" ? "all recorded" : `the last ${timeRange}`} visitor activity.`
              : "Your activity will appear here as soon as visitors interact with your pages."}
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

      {/* Statistics Grid */}
      <StatCardGrid>
        <StatCard
          label="Total Views (Impression)"
          value={rangeMetrics.views.toLocaleString()}
          sub={hasEventHistory ? `${timeRange} visitor activity` : "Live impression count"}
        />
        <StatCard
          label="Total Clicks (Ads/Social)"
          value={rangeMetrics.clicks.toLocaleString()}
          sub={hasEventHistory ? `${timeRange} click activity` : "Dynamic click logs"}
        />
        <StatCard
          label="Registrations (Leads Form)"
          value={rangeMetrics.registers.toLocaleString()}
          sub={hasEventHistory ? `${timeRange} form submissions` : "New leads form submissions"}
        />
        <StatCard
          label="Active Bio Pages"
          value={metrics.activePages.toLocaleString()}
          sub={`${metrics.activePages} page(s) live`}
        />
      </StatCardGrid>

      {/* Main Visual Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 key-workspace-grid">
        {/* Click Performance Graph */}
        <Workspace className="lg:col-span-8 key-section-card flex flex-col relative overflow-hidden min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h3 className="font-bold text-slate-800">Click Performance</h3>
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
              <p className="text-sm font-semibold text-indigo-400">
                ✨ Live Real-Time Activity Tracking Enabled
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {filteredEvents.length} action{filteredEvents.length === 1 ? "" : "s"} in the selected range.
              </p>
            </div>
          ) : (
            <div className="mb-4 text-left">
              <p className="text-sm font-medium text-slate-600">Awaiting your first clicks</p>
              <p className="text-xs text-slate-500 mt-1">
                Click metrics will plot automatically as soon as users visit your active links.
              </p>
            </div>
          )}
          
          <div className="flex-1 flex items-end justify-between px-2 gap-2 sm:gap-4 h-48 relative border-b border-slate-100" role="img" aria-label="Clicks by day for the past seven days">
            {chartData.map((day) => (
              <div key={day.date.toISOString()} className="flex-1 h-full rounded-t-lg bg-slate-50 relative group flex items-end">
                <div
                  className="w-full rounded-t-md bg-indigo-500 transition-[height] duration-300 group-hover:bg-indigo-600"
                  style={{ height: `${(day.clicks / maxChartValue) * 100}%`, minHeight: day.clicks ? "4px" : "2px" }}
                />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 hidden rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                  {day.clicks} click{day.clicks === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-bold">
            {chartData.map((day) => <span key={day.date.toISOString()}>{day.label}</span>)}
          </div>
        </Workspace>

        {/* Recent Activity / Top Bio Pages */}
        <Workspace className="lg:col-span-4 key-section-card flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-bold text-slate-800 mb-6">Top Bio Pages</h3>
            <div className="space-y-4">
              {pages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
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
                      className="flex w-full items-center p-3 rounded-lg border border-slate-200/60 bg-white/50 hover:bg-white/80 transition-colors text-left"
                      aria-label={`Open ${page.title}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shrink-0 mr-3 flex items-center justify-center text-white font-black text-xs shadow-sm">{initials}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate text-slate-800">{page.title}</div>
                        <div className="text-xs text-slate-400 truncate">{page.slug}</div>
                      </div>
                      <div className="ml-auto text-xs font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">{page.views}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(ScreenId.BIO_PAGES)}
            className="mt-6 w-full py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-colors border border-indigo-100/60"
          >
            View All Pages
          </button>
        </Workspace>
      </div>

      {/* Visitor Session & Event Activity Log Table */}
      <Workspace className="key-section-card min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">Real-Time Traffic & Action Tracker</h3>
            <p className="text-xs text-slate-500">Track which domain, client ports, devices, OS, and actions users perform globally.</p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Connection
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <p className="font-semibold text-slate-500 mb-1">
                {hasEventHistory ? "No activity in this date range" : "🔍 Waiting for your first live session"}
              </p>
              <p className="text-slate-400 leading-normal max-w-md mx-auto">
                {hasEventHistory
                  ? "Choose a longer date range to see earlier visitor activity."
                  : 'Scan the QR code of any BioPage using a mobile device, or click "Open visit" in the editor on your laptop. Real-time details will appear here instantly!'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold font-mono">
                  <th className="p-3.5">Action & Label</th>
                  <th className="p-3.5">Device Profile</th>
                  <th className="p-3.5">Network Ports</th>
                  <th className="p-3.5">Host Domain</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.slice(0, 10).map((event, index) => {
                  let badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-100";
                  if (event.eventType === "click") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  if (event.eventType === "register") badgeColor = "bg-amber-50 text-amber-700 border-amber-100";

                  return (
                    <tr key={event.id || `${event.timestamp || "event"}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                            {(event.eventType || "visit").toUpperCase()}
                          </span>
                          <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                            {event.eventLabel || "Page Visit"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-700 flex items-center gap-1">
                            <span>{event.device === "Mobile" ? "📱" : event.device === "Tablet" ? "📟" : "💻"}</span>
                            <span>{event.device} ({event.os})</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{event.browser} Browser</div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {event.port || "N/A"}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-indigo-600 bg-indigo-50/40 border border-indigo-100/50 px-2 py-0.5 rounded text-[11px] font-mono">
                          {event.domain || "key.link"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono">
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
      <div className="space-y-6">
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
                className={`group key-glass-card p-4 sm:p-6 flex flex-col items-center justify-center text-center transition-all duration-300 ${qa.bgHover} hover:-translate-y-1 min-w-0`}
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${qa.color} flex items-center justify-center ${qa.iconColor} mb-6`}
                >
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <h4 className="font-sans font-semibold text-sm text-slate-900">{qa.label}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{qa.sub}</p>
                <ArrowRight className="h-3.5 w-3.5 mt-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
