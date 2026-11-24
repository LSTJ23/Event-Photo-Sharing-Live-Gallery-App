import type { Request, Response } from "express";

// Event details returned from the database.
export interface EventRow {
  id: string;
  name: string;
  eventDate: string | null; // Event date in YYYY-MM-DD format
  venue: string | null;
}

export interface EventSlugDeps {
  // Finds an event using its public link code. Returns null if not found.
  findEventByCode(code: string): Promise<EventRow | null>;
  // Allows tests to provide a fixed date.
  today?: () => string;
}

// Allows only letters, numbers, hyphens, and underscores.
const VALID_CODE = /^[A-Za-z0-9_-]{1,100}$/;

// Gets today's date in Manila using YYYY-MM-DD format.
function todayInManila(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

// Handles requests to check an event's public link.
export function createEventSlugHandler(deps: EventSlugDeps) {
  return async (request: Request, response: Response) => {
    // Gets the event code from the URL.
    const code = String(request.params.qrSlug ?? "").trim();

    // Rejects invalid codes without querying the database.
    if (!VALID_CODE.test(code)) {
      return response.status(404).json({ valid: false, error: "Event is invalid or does not exist." });
    }

    try {
      // Looks for an event with the given code.
      const event = await deps.findEventByCode(code);

      // Returns an error if the event does not exist.
      if (!event) {
        return response.status(404).json({ valid: false, error: "Event is invalid or does not exist." });
      }

      // Checks if the event date has already passed.
      const today = deps.today ? deps.today() : todayInManila();
      if (event.eventDate && event.eventDate < today) {
        return response.status(410).json({
          valid: false,
          error: "This event has ended and is no longer accepting entries."
        });
      }

      // Returns the event details if the link is valid.
      return response.status(200).json({
        valid: true,
        event: { id: event.id, name: event.name, date: event.eventDate, venue: event.venue }
      });
    } catch {
      // Returns a server error if the database lookup fails.
      return response.status(500).json({ error: "Internal server error." });
    }
  };
}