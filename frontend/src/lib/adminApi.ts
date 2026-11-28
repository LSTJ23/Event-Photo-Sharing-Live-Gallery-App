import { getSupabase } from "./supabase";
import type { AdminEvent, EventForm, Organizer } from "./adminData";

interface EventRow {
  id: string;
  organizer_id: string;
  name: string;
  location: string;
  hashtag: string | null;
  start_at: string;
  end_at: string;
  photo_capacity: number;
  share_slug: string;
  share_link_active: boolean;
  archived_at: string | null;
  participant_count: number;
  photo_count: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error("Please sign in again.");
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    cache: "no-store"
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result as T;
}

function localParts(value: string): { date: string; time: string } {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid event time returned by the server.");
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`
  };
}

function localInstant(day: string, time: string): string {
  const value = new Date(`${day}T${time}:00`);
  if (!Number.isFinite(value.getTime())) throw new Error("Enter a valid event date and time.");
  const parts = localParts(value.toISOString());
  if (parts.date !== day || parts.time !== time) throw new Error("Enter a valid local event date and time.");
  return value.toISOString();
}

function toEvent(row: EventRow): AdminEvent {
  const start = localParts(row.start_at);
  const end = localParts(row.end_at);
  const now = Date.now();
  const status = now < Date.parse(row.start_at) ? "UPCOMING" : now <= Date.parse(row.end_at) ? "LIVE" : "ENDED";
  return {
    id: row.id, name: row.name, venue: row.location, organizerId: row.organizer_id,
    hashtag: row.hashtag || "", capacity: row.photo_capacity,
    date: start.date, time: start.time, endDate: end.date, endTime: end.time,
    status, participants: row.participant_count, photoCount: row.photo_count, covers: [],
    archived: !!row.archived_at, shareSlug: row.share_slug, shareLinkActive: row.share_link_active
  };
}

export async function listOrganizers(): Promise<Organizer[]> {
  return request<Organizer[]>("/organizers");
}

export async function listEvents(): Promise<AdminEvent[]> {
  return (await request<EventRow[]>("/events")).map(toEvent);
}

export async function createEvent(form: EventForm): Promise<AdminEvent> {
  const row = await request<EventRow>("/events", {
    method: "POST",
    body: JSON.stringify({
      name: form.name, venue: form.venue, organizerId: form.organizerId, hashtag: form.hashtag,
      capacity: Number(form.capacity), startAt: localInstant(form.date, form.time),
      endAt: localInstant(form.endDate, form.endTime)
    })
  });
  return toEvent(row);
}
