import type { ShortLinkClickEvent, ShortLinkRecord } from "./types";

export type PeriodCounts = {
  total: number;
  today: number;
  week: number;
  month: number;
};

export type DeviceBreakdown = {
  mobile: number;
  desktop: number;
  tablet: number;
  other: number;
};

const MS_DAY = 24 * 60 * 60 * 1000;

function startOfLocalDay(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function inRange(at: string, sinceMs: number) {
  const t = new Date(at).getTime();
  return Number.isFinite(t) && t >= sinceMs;
}

function detectDevice(userAgent = ""): keyof DeviceBreakdown {
  const ua = userAgent.toLowerCase();
  if (!ua) return "other";
  if (/ipad|tablet|kindle|playbook|silk|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) return "mobile";
  if (/windows|macintosh|linux|cros|x11/.test(ua)) return "desktop";
  return "other";
}

export function buildShortLinkAnalytics(record: ShortLinkRecord): {
  summary: PeriodCounts;
  devices: DeviceBreakdown;
  daily: Array<{ label: string; value: number }>;
} {
  const events = Array.isArray(record.clickEvents) ? record.clickEvents : [];
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const weekStart = now.getTime() - 7 * MS_DAY;
  const monthStart = now.getTime() - 30 * MS_DAY;

  const summary: PeriodCounts = {
    total: record.totalClicks || events.length,
    today: events.filter((e) => inRange(e.at, todayStart)).length,
    week: events.filter((e) => inRange(e.at, weekStart)).length,
    month: events.filter((e) => inRange(e.at, monthStart)).length
  };

  const devices: DeviceBreakdown = { mobile: 0, desktop: 0, tablet: 0, other: 0 };
  for (const event of events) {
    devices[detectDevice(event.userAgent)] += 1;
  }

  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyMap = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(todayStart - i * MS_DAY);
    const key = day.toISOString().slice(0, 10);
    dailyMap.set(key, 0);
  }
  for (const event of events) {
    const key = event.at.slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
    }
  }
  const daily = Array.from(dailyMap.entries()).map(([iso, value]) => {
    const d = new Date(`${iso}T12:00:00`);
    return { label: labels[d.getDay()] || iso, value };
  });

  return { summary, devices, daily };
}
