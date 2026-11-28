// Sample data for the organizer dashboard, until the backend exists.
// Event ids match the participant/admin mock data (lib/mockApi.ts), so the
// dashboard's Gallery and QR code buttons open the same event.
import { mainReason, sampleReports, type SampleReportEntry } from "./sampleReports";

/** ENDED events move to Past events, where they can be archived or deleted. */
export type EventStatus = "LIVE" | "UPCOMING" | "ENDED";

export interface OrganizerPhoto {
  id: number;
  /** Placeholder grey for the photo until real images exist. */
  shade: string;
}

export interface OrganizerEvent {
  id: string;
  name: string;
  when: string;
  venue: string;
  status: EventStatus;
  participants: number;
  /** Most photos guests can add. */
  capacity: number;
  photos: OrganizerPhoto[];
  /** Photos shared per hour: [label, count]. */
  hours: [string, number][];
  /** Archived past events are tucked away under Past events → Archived. */
  archived?: boolean;
}

/** open: waiting for the organizer. kept: photo stays. deleted: photo removed from the gallery. */
export type ReportState = "open" | "kept" | "deleted";

/** One reported photo and every report on it (each report is one person). */
export interface PhotoReport {
  id: number;
  eventId: string;
  /** The reported photo in the event gallery (matches the photo ids the API returns). */
  galleryPhotoId: string;
  /** The reason most people gave. */
  reason: string;
  /** Each report: who, why and when (newest first). */
  entries: SampleReportEntry[];
  /** When it was first reported. */
  time: string;
  sharedBy: string;
  /** Placeholder grey, used if the real photo can't be loaded. */
  shade: string;
  unread: boolean;
  state: ReportState;
}

export const shade = (i: number) => {
  const v = 150 + ((i * 37) % 80);
  return `rgb(${v},${v},${v})`;
};

const makePhotos = (n: number): OrganizerPhoto[] => Array.from({ length: n }, (_, i) => ({ id: i, shade: shade(i) }));

export const initialEvents: OrganizerEvent[] = [
  {
    id: "dlsu-cso-event",
    name: "DLSU CSO Event",
    when: "Oct 14, 2026",
    venue: "Manila",
    status: "LIVE",
    participants: 22,
    capacity: 200,
    photos: makePhotos(48),
    hours: [
      ["6 PM", 2],
      ["7 PM", 5],
      ["8 PM", 9],
      ["9 PM", 14],
      ["10 PM", 8],
      ["11 PM", 6],
      ["12 AM", 4]
    ]
  },
  {
    id: "event-2",
    name: "Event 2",
    when: "Dec 3, 2026",
    venue: "TBD",
    status: "UPCOMING",
    participants: 0,
    capacity: 300,
    photos: [],
    hours: []
  },
  {
    id: "freshmen-welcome-night",
    name: "Freshmen Welcome Night",
    when: "Aug 22, 2026",
    venue: "Teresa Yuchengco Auditorium",
    status: "ENDED",
    participants: 31,
    capacity: 300,
    photos: makePhotos(12),
    hours: [
      ["5 PM", 2],
      ["6 PM", 4],
      ["7 PM", 3],
      ["8 PM", 2],
      ["9 PM", 1]
    ]
  }
];

export const initialReports: PhotoReport[] = sampleReports.map((r, i) => ({
  id: i + 1,
  eventId: r.eventId,
  galleryPhotoId: r.photoId,
  reason: mainReason(r.entries),
  entries: r.entries,
  time: r.time,
  sharedBy: r.sharedBy,
  shade: shade(r.shadeIndex),
  unread: r.state === "waiting",
  state: r.state === "waiting" ? "open" : r.state === "kept" ? "kept" : "deleted"
}));
