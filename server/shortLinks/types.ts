export type ShortLinkStatus = "Live" | "Paused";

export type ShortLinkRetarget = "fb" | "google" | "tiktok" | "snapchat";

export type ShortLinkClickEvent = {
  at: string;
  userAgent?: string;
  referer?: string;
};

export type ShortLinkRecord = {
  id: string;
  ownerUserId: string;
  title: string;
  slug: string;
  /** Platform host or verified custom domain hostname. */
  hostDomain: string;
  destinationUrl: string;
  status: ShortLinkStatus;
  retargeting: ShortLinkRetarget[];
  totalClicks: number;
  clickEvents?: ShortLinkClickEvent[];
  createdAt: string;
  updatedAt: string;
};
