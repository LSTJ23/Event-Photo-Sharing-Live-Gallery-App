// Sample data and rules for the admin dashboard, until the backend exists.
//
// Admins create events and assign an event organizer (EO) to each one while
// creating it; the organizer then gets an email invite to that event. Admins
// also create and edit organizer accounts, and can see reported photos, but
// only the event's organizer can keep or remove a reported photo.
//
// Event ids match the organizer and participant mock data, so the admin's
// Gallery and QR buttons open the same event pages.
import { initialEvents, shade } from "./organizerData";

export type AdminEventStatus = "LIVE" | "UPCOMING" | "ENDED";

export interface AdminEvent {
  id: string;
  name: string;
  venue: string;
  organizerId: string;
  /** Without the leading #. */
  hashtag: string;
  /** Most photos the gallery takes. */
  capacity: number;
  /** Start date, yyyy-mm-dd */
  date: string;
  /** Start time, HH:MM, 24-hour */
  time: string;
  /** End date, yyyy-mm-dd (the same as the start for one-day events) */
  endDate: string;
  /** End time, HH:MM, 24-hour */
  endTime: string;
  status: AdminEventStatus;
  photoCount: number;
  /** A few placeholder greys for the event card, until real photos exist. */
  covers: string[];
}

export type OrganizerStatus = "active" | "invited";

export interface Organizer {
  id: string;
  /** Organization name, e.g. "DLSU CSO". */
  org: string;
  person: string;
  email: string;
  status: OrganizerStatus;
}

export interface ReportEntry {
  /** Who reported it (participants can stay anonymous). */
  by: string;
  reason: string;
  time: string;
}

export interface AdminReport {
  id: number;
  eventId: string;
  /** The most common reason. */
  reason: string;
  /** How many people reported the photo. */
  count: number;
  /** When it was first reported. */
  time: string;
  /** Who shared the photo. */
  sharedBy: string;
  /** Each report: who, why and when (newest first). */
  entries: ReportEntry[];
  /** When the organizer kept or removed it. */
  decidedAt?: string;
  /** "waiting": the organizer hasn't kept or removed it yet. */
  state: "waiting" | "kept" | "removed";
  shade: string;
}

const [dlsu, event2] = initialEvents;

export const initialAdminEvents: AdminEvent[] = [
  {
    id: dlsu.id,
    name: dlsu.name,
    venue: dlsu.venue,
    organizerId: "org-1",
    hashtag: "DLSUCSO",
    capacity: dlsu.capacity,
    date: "2026-10-14",
    time: "18:00",
    endDate: "2026-10-14",
    endTime: "23:00",
    status: "LIVE",
    photoCount: dlsu.photos.length,
    covers: dlsu.photos.slice(0, 4).map((p) => p.shade)
  },
  {
    id: event2.id,
    name: event2.name,
    venue: event2.venue,
    organizerId: "org-2",
    hashtag: "",
    capacity: event2.capacity,
    date: "2026-12-03",
    time: "",
    endDate: "2026-12-03",
    endTime: "",
    status: "UPCOMING",
    photoCount: 0,
    covers: []
  },
  {
    id: "freshmen-welcome-night",
    name: "Freshmen Welcome Night",
    venue: "Teresa Yuchengco Auditorium",
    organizerId: "org-1",
    hashtag: "WelcomeNight",
    capacity: 300,
    date: "2026-08-22",
    time: "17:00",
    endDate: "2026-08-23",
    endTime: "01:00",
    status: "ENDED",
    photoCount: 126,
    covers: [shade(3), shade(11), shade(19), shade(27)]
  }
];

/** Past events are the ones that have ended; the rest (live and upcoming) are current. */
export const isPast = (event: AdminEvent) => event.status === "ENDED";

export const initialOrganizers: Organizer[] = [
  { id: "org-1", org: "Org 1", person: "Person 1", email: "person1@org1.example", status: "active" },
  { id: "org-2", org: "Org 2", person: "Person 2", email: "person2@org2.example", status: "active" },
  { id: "org-3", org: "Org 3", person: "Person 3", email: "person3@org3.example", status: "invited" }
];

export const initialAdminReports: AdminReport[] = [
  {
    id: 1,
    eventId: dlsu.id,
    reason: "Inappropriate",
    count: 3,
    time: "2 h ago",
    state: "waiting",
    shade: shade(7),
    sharedBy: "Anonymous",
    entries: [
      { by: "Participant 12", reason: "Inappropriate", time: "35 min ago" },
      { by: "Anonymous", reason: "Inappropriate", time: "1 h ago" },
      { by: "Participant 4", reason: "Spam", time: "2 h ago" }
    ]
  },
  {
    id: 2,
    eventId: dlsu.id,
    reason: "Not from this event",
    count: 2,
    time: "1 h ago",
    state: "waiting",
    shade: shade(23),
    sharedBy: "Carlo Garcia",
    entries: [
      { by: "Participant 9", reason: "Not from this event", time: "40 min ago" },
      { by: "Anonymous", reason: "Not from this event", time: "1 h ago" }
    ]
  },
  {
    id: 3,
    eventId: dlsu.id,
    reason: "I'm in it and want it removed",
    count: 1,
    time: "25 min ago",
    state: "waiting",
    shade: shade(31),
    sharedBy: "Andrea Lim",
    entries: [{ by: "Bea Cruz", reason: "I'm in it and want it removed", time: "25 min ago" }]
  },
  {
    id: 4,
    eventId: dlsu.id,
    reason: "Spam",
    count: 1,
    time: "Yesterday",
    state: "kept",
    shade: shade(40),
    sharedBy: "Paolo Reyes",
    entries: [{ by: "Anonymous", reason: "Spam", time: "Yesterday" }],
    decidedAt: "Yesterday"
  }
];

export function getStats(events: AdminEvent[], organizers: Organizer[]) {
  return {
    totalEvents: events.length,
    activeEvents: events.filter((e) => e.status === "LIVE").length,
    activeUsers: organizers.filter((o) => o.status === "active").length
  };
}

export interface TopOrganizer {
  organizer: Organizer;
  events: number;
  photos: number;
}

/** Organizers with the most photos across their events first (then most events). Leaves out those with no events. */
export function topOrganizers(events: AdminEvent[], organizers: Organizer[]): TopOrganizer[] {
  return organizers
    .map((organizer) => {
      const theirs = events.filter((e) => e.organizerId === organizer.id);
      return { organizer, events: theirs.length, photos: theirs.reduce((n, e) => n + e.photoCount, 0) };
    })
    .filter((t) => t.events > 0)
    .sort((a, b) => b.photos - a.photos || b.events - a.events);
}

/** "6:00 PM" from "18:00". */
export function formatClock(time: string): string {
  const [h, min] = time.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(min).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "Oct 14, 2026" from "2026-10-14". */
export function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * When an event runs, from its start and end:
 * one day: "Oct 14, 2026 · 6:00 PM – 11:00 PM";
 * several days: "Aug 22, 2026, 5:00 PM – Aug 23, 2026, 1:00 AM".
 */
export function formatWhen(date: string, time: string, endDate = "", endTime = ""): string {
  if (!date) return "Date not set";
  const sameDay = !endDate || endDate === date;
  if (sameDay) {
    if (!time) return formatDay(date);
    return `${formatDay(date)} · ${formatClock(time)}${endTime ? ` – ${formatClock(endTime)}` : ""}`;
  }
  const start = time ? `${formatDay(date)}, ${formatClock(time)}` : formatDay(date);
  const end = endTime ? `${formatDay(endDate)}, ${formatClock(endTime)}` : formatDay(endDate);
  return `${start} – ${end}`;
}

/** Case-insensitive search across the given fields. */
export function matches(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  return !q || fields.some((f) => f?.toLowerCase().includes(q));
}

export interface EventForm {
  name: string;
  venue: string;
  organizerId: string;
  hashtag: string;
  capacity: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

/** Problems with an event form, by field. Empty when it can be saved. */
export function eventFormErrors(form: EventForm, minCapacity = 1): FormErrors<EventForm> {
  const errors: FormErrors<EventForm> = {};
  if (!form.name.trim()) errors.name = "Enter the event name.";
  if (!form.venue.trim()) errors.venue = "Enter the venue.";
  if (!form.organizerId) errors.organizerId = "Choose who will organize this event.";
  if (form.hashtag.trim().replace(/^#/, "") && !/^#?[A-Za-z0-9_]+$/.test(form.hashtag.trim()))
    errors.hashtag = "Use letters, numbers and underscores only.";
  const capacity = Number(form.capacity);
  if (!form.capacity.trim() || !Number.isInteger(capacity) || capacity < 1) errors.capacity = "Enter a whole number of photos.";
  else if (capacity < minCapacity) errors.capacity = `Can't be lower than the ${minCapacity} photos already shared.`;
  if (!form.date) errors.date = "Pick the start date.";
  if (!form.time) errors.time = "Pick a start time.";
  if (!form.endDate) errors.endDate = "Pick the end date.";
  if (!form.endTime) errors.endTime = "Pick an end time.";
  if (form.date && form.time && form.endDate && form.endTime && `${form.endDate}T${form.endTime}` <= `${form.date}T${form.time}`)
    errors.endTime = "The event must end after it starts.";
  return errors;
}

export interface UserForm {
  org: string;
  person: string;
  email: string;
}

/** Problems with an organizer form, by field. Empty when it can be saved. */
export function userFormErrors(form: UserForm, organizers: Organizer[], editingId?: string): FormErrors<UserForm> {
  const errors: FormErrors<UserForm> = {};
  if (!form.org.trim()) errors.org = "Enter the organization's name.";
  if (!form.person.trim()) errors.person = "Enter the contact person's name.";
  const email = form.email.trim().toLowerCase();
  if (!email) errors.email = "Enter their email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  else if (organizers.some((o) => o.id !== editingId && o.email.toLowerCase() === email))
    errors.email = "There's already an account with this email.";
  return errors;
}

export type AttentionKind = "reports" | "nearlyFull" | "noTime" | "invite";

export interface AttentionItem {
  kind: AttentionKind;
  /** The event or organizer it's about. */
  id: string;
  title: string;
  detail: string;
}

/** A gallery this full (percent) gets flagged on the home page. */
export const NEARLY_FULL = 80;

/**
 * What the admin should look at first: reported photos an organizer hasn't
 * dealt with yet, galleries nearly full, upcoming events with no start time,
 * and organizers who haven't accepted their invite.
 */
export function needsAttention(events: AdminEvent[], organizers: Organizer[], reports: AdminReport[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  const orgName = (id: string) => organizers.find((o) => o.id === id)?.org ?? "the organizer";
  for (const e of events) {
    const waiting = reports.filter((r) => r.eventId === e.id && r.state === "waiting");
    if (waiting.length > 0)
      items.push({
        kind: "reports",
        id: e.id,
        title: `${waiting.length} reported photo${waiting.length === 1 ? "" : "s"} in ${e.name} waiting for ${orgName(e.organizerId)}`,
        detail: "Only the organizer can keep or remove them. You can remind them."
      });
  }
  for (const e of events) {
    const pct = e.capacity > 0 ? Math.round((e.photoCount / e.capacity) * 100) : 100;
    if (e.status === "LIVE" && pct >= NEARLY_FULL)
      items.push({
        kind: "nearlyFull",
        id: e.id,
        title: `${e.name} is ${pct}% full`,
        detail: `${e.photoCount} of ${e.capacity} photos. Uploads stop at the limit.`
      });
  }
  for (const e of events) {
    if (e.status === "UPCOMING" && (!e.time || !e.endTime))
      items.push({
        kind: "noTime",
        id: e.id,
        title: `${e.name} has no ${!e.time ? "start" : "end"} time`,
        detail: `${formatWhen(e.date, "")} · ${e.venue}`
      });
  }
  for (const o of organizers) {
    if (o.status === "invited")
      items.push({ kind: "invite", id: o.id, title: `${o.org} hasn't accepted their invite`, detail: `Sent to ${o.email}` });
  }
  return items;
}
