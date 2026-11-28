// Sample reported photos, shared by the admin and organizer dashboards so both
// show the same reports until the backend exists. Photo ids match the sample
// photos in lib/mockApi.ts; reasons come from REPORT_REASONS.

export interface SampleReportEntry {
  /** Who reported it (participants can stay anonymous). */
  by: string;
  reason: string;
  time: string;
}

export interface SampleReport {
  eventId: string;
  /** The reported photo (matches the photo ids the API returns). */
  photoId: string;
  /** Who shared the photo. */
  sharedBy: string;
  /** When it was first reported. */
  time: string;
  /** "waiting" for the organizer, or what they decided. */
  state: "waiting" | "kept" | "removed";
  decidedAt?: string;
  /** Each report: who, why and when (newest first). */
  entries: SampleReportEntry[];
  /** Placeholder grey, used if the real photo can't be loaded. */
  shadeIndex: number;
}

export const sampleReports: SampleReport[] = [
  {
    eventId: "dlsu-cso-event",
    photoId: "sample-9",
    sharedBy: "Anonymous",
    time: "2 h ago",
    state: "waiting",
    shadeIndex: 7,
    entries: [
      { by: "Participant 12", reason: "Inappropriate content", time: "35 min ago" },
      { by: "Anonymous", reason: "Inappropriate content", time: "1 h ago" },
      { by: "Participant 4", reason: "Spam", time: "2 h ago" }
    ]
  },
  {
    eventId: "dlsu-cso-event",
    photoId: "sample-23",
    sharedBy: "Carlo Garcia",
    time: "1 h ago",
    state: "waiting",
    shadeIndex: 23,
    entries: [
      { by: "Participant 9", reason: "Not from this event", time: "40 min ago" },
      { by: "Anonymous", reason: "Not from this event", time: "1 h ago" }
    ]
  },
  {
    eventId: "dlsu-cso-event",
    photoId: "sample-22",
    sharedBy: "Andrea Lim",
    time: "25 min ago",
    state: "waiting",
    shadeIndex: 31,
    entries: [{ by: "Bea Cruz", reason: "I'm in it and want it removed", time: "25 min ago" }]
  },
  {
    eventId: "dlsu-cso-event",
    photoId: "sample-13",
    sharedBy: "Paolo Reyes",
    time: "Yesterday",
    state: "kept",
    decidedAt: "Yesterday",
    shadeIndex: 40,
    entries: [{ by: "Anonymous", reason: "Spam", time: "Yesterday" }]
  }
];

/** The reason most people gave (the first one given, if tied). */
export function mainReason(entries: SampleReportEntry[]): string {
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.reason, (counts.get(e.reason) ?? 0) + 1);
  let best = entries[0]?.reason ?? "";
  for (const [reason, n] of counts) if (n > (counts.get(best) ?? 0)) best = reason;
  return best;
}
