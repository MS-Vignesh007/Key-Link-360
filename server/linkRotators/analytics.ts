import type { LinkRotatorClickEvent, LinkRotatorRecord } from "./types";

export type PeriodCounts = {
  total: number;
  today: number;
  week: number;
  month: number;
};

export type DestinationAnalytics = {
  id: string;
  url: string;
  probability: number;
  clicks: PeriodCounts;
  /** Share of all recorded clicks (0–100). */
  clickSharePercent: number;
};

const MS_DAY = 24 * 60 * 60 * 1000;

function startOfLocalDay(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function inRange(at: string, sinceMs: number) {
  const t = new Date(at).getTime();
  return Number.isFinite(t) && t >= sinceMs;
}

function countEvents(events: LinkRotatorClickEvent[], predicate?: (e: LinkRotatorClickEvent) => boolean) {
  if (!predicate) return events.length;
  return events.filter(predicate).length;
}

export function buildRotatorAnalytics(record: LinkRotatorRecord): {
  summary: PeriodCounts;
  destinations: DestinationAnalytics[];
} {
  const events = Array.isArray(record.clickEvents) ? record.clickEvents : [];
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const weekStart = now.getTime() - 7 * MS_DAY;
  const monthStart = now.getTime() - 30 * MS_DAY;

  // When the event log still holds the full history, rebuild totals from events
  // (never invent clicks — this can only lower inflated counters).
  const fullHistoryInEvents =
    events.length > 0 && events.length >= (Number(record.totalClicks) || 0);

  const destinations: DestinationAnalytics[] = record.destinations.map((destination) => {
    const destEvents = events.filter((event) => {
      if (event.destinationId && destination.id) {
        return event.destinationId === destination.id;
      }
      return Boolean(event.url && event.url === destination.url);
    });
    const stored = Number(destination.clicks) || 0;
    const fromEvents = destEvents.length;
    const total = fullHistoryInEvents ? fromEvents : stored;
    const clicks: PeriodCounts = {
      total,
      today: countEvents(destEvents, (e) => inRange(e.at, todayStart)),
      week: countEvents(destEvents, (e) => inRange(e.at, weekStart)),
      month: countEvents(destEvents, (e) => inRange(e.at, monthStart))
    };

    return {
      id: destination.id,
      url: destination.url,
      probability: destination.probability,
      clicks,
      clickSharePercent: 0
    };
  });

  const destinationsStoredTotal = destinations.reduce(
    (sum, destination) => sum + destination.clicks.total,
    0
  );
  const summary: PeriodCounts = {
    total: destinationsStoredTotal || Number(record.totalClicks) || 0,
    today: countEvents(events, (e) => inRange(e.at, todayStart)),
    week: countEvents(events, (e) => inRange(e.at, weekStart)),
    month: countEvents(events, (e) => inRange(e.at, monthStart))
  };

  for (const destination of destinations) {
    destination.clickSharePercent =
      summary.total > 0
        ? Math.round((destination.clicks.total / summary.total) * 1000) / 10
        : 0;
  }

  return { summary, destinations };
}
