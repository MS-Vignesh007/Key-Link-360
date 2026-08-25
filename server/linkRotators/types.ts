export type LinkRotatorStatus = "Active" | "Inactive";

export type LinkRotatorDestinationRecord = {
  id: string;
  url: string;
  probability: number;
  /** Lifetime clicks sent to this destination. */
  clicks?: number;
};

export type LinkRotatorClickEvent = {
  destinationId: string;
  url: string;
  at: string;
};

export type LinkRotatorRecord = {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  slug: string;
  /** Platform host or verified custom domain hostname. */
  hostDomain: string;
  status: LinkRotatorStatus;
  destinations: LinkRotatorDestinationRecord[];
  totalClicks: number;
  /** Recent click history for today / week / month charts (newest first). */
  clickEvents?: LinkRotatorClickEvent[];
  createdAt: string;
  updatedAt: string;
};
