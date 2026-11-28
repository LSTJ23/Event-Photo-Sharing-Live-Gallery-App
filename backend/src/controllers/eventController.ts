import type { SupabaseClient } from "@supabase/supabase-js";
import type { Request, Response } from "express";
import { AuthError, type AuthService } from "./authController.js";

class EventError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 500) {
    throw new EventError(400, `Invalid ${field}.`);
  }
  return value.trim();
}

function instant(value: unknown, field: string): string {
  const input = text(value, field);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input)) {
    throw new EventError(400, `Invalid ${field}.`);
  }
  const date = new Date(input);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== input) {
    throw new EventError(400, `Invalid ${field}.`);
  }
  return input;
}

function handler(auth: AuthService, fn: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    res.set("Cache-Control", "no-store");
    try {
      const authorization = req.get("authorization");
      if (!authorization?.startsWith("Bearer ") || !authorization.slice(7).trim()) {
        throw new AuthError(401, "Please sign in.");
      }
      const user = await auth.currentUser(authorization.slice(7).trim());
      if (user.role !== "admin" || user.mustChangePassword) {
        throw new AuthError(403, "Admin access is required.");
      }
      await fn(req, res);
    } catch (error) {
      if (error instanceof AuthError || error instanceof EventError) {
        res.status(error.status).json({ error: error.message });
      } else {
        console.error("Admin event request failed:", error);
        res.status(500).json({ error: "Event service is temporarily unavailable." });
      }
    }
  };
}

const eventColumns = "id,organizer_id,name,location,hashtag,start_at,end_at,photo_capacity,share_slug,share_link_active,archived_at,created_at";

export function createEventHandlers(supabase: SupabaseClient, auth: AuthService) {
  return {
    organizers: handler(auth, async (_req, res) => {
      const { data, error } = await supabase.from("staff_users")
        .select("id,full_name,organization_name,email")
        .eq("role", "organizer").eq("is_active", true).order("full_name");
      if (error) throw error;
      res.json(data.map((row) => ({
        id: row.id, person: row.full_name, org: row.organization_name || row.full_name,
        email: row.email, status: "active"
      })));
    }),

    listEvents: handler(auth, async (_req, res) => {
      const [events, stats] = await Promise.all([
        supabase.from("events").select(eventColumns).order("start_at", { ascending: false }),
        supabase.from("event_stats").select("event_id,participant_count,photo_count")
      ]);
      if (events.error) throw events.error;
      if (stats.error) throw stats.error;
      const counts = new Map(stats.data.map((row) => [row.event_id, row]));
      res.json(events.data.map((row) => {
        const count = counts.get(row.id);
        if (!count) throw new Error("Missing event statistics.");
        return { ...row, participant_count: count.participant_count, photo_count: count.photo_count };
      }));
    }),

    createEvent: handler(auth, async (req, res) => {
      const name = text(req.body?.name, "event name");
      const location = text(req.body?.venue, "venue");
      const organizerId = text(req.body?.organizerId, "organizer");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizerId)) {
        throw new EventError(400, "Invalid organizer.");
      }
      const capacity: unknown = req.body?.capacity;
      if (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 1 || capacity > 2147483647) {
        throw new EventError(400, "Photo capacity must be a positive whole number.");
      }
      const startAt = instant(req.body?.startAt, "start time");
      const endAt = instant(req.body?.endAt, "end time");
      if (endAt <= startAt) throw new EventError(400, "Event must end after it starts.");
      const hashtagValue: unknown = req.body?.hashtag;
      if (hashtagValue !== undefined && typeof hashtagValue !== "string") {
        throw new EventError(400, "Invalid hashtag.");
      }
      const hashtag = typeof hashtagValue === "string" ? hashtagValue.trim().replace(/^#/, "") : "";
      if (hashtag && (hashtag.length > 500 || !/^[A-Za-z0-9_]+$/.test(hashtag))) {
        throw new EventError(400, "Hashtag must contain only letters, numbers, and underscores.");
      }

      const organizer = await supabase.from("staff_users").select("id")
        .eq("id", organizerId).eq("role", "organizer").eq("is_active", true).maybeSingle();
      if (organizer.error) throw organizer.error;
      if (!organizer.data) throw new EventError(400, "Choose an active organizer.");

      const now = Date.now();
      const status = now < Date.parse(startAt) ? "upcoming" : now <= Date.parse(endAt) ? "ongoing" : "ended";
      const { data, error } = await supabase.from("events").insert({
        organizer_id: organizerId, name, location, hashtag: hashtag || null,
        start_at: startAt, end_at: endAt, photo_capacity: capacity, status
      }).select(eventColumns).single();
      if (error) throw error;
      res.status(201).json({ ...data, participant_count: 0, photo_count: 0 });
    })
  };
}
