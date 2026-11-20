import type { Request, Response } from "express";
import { getEventStatus } from "../eventStatus.js";

// Describes the event information returned by the database.
export interface EoEventRow {
  id: string;
  name: string;
  startsAt: string; // Event start date from the database.
  endsAt: string;
  venue: string | null;
  reportedPhotosCount: number;
}

export interface EoEventsDeps {
  // Gets the events assigned to an organizer and their pending reported-photo count.
  findEventsByOrganizer(organizerId: string): Promise<EoEventRow[]>;

  // Allows tests to use a fixed date and time.
  now?: () => Date;
}

// Creates the handler that loads an organizer's events.
export function createEoEventsHandler(deps: EoEventsDeps) {
  return async (_request: Request, response: Response) => {
    // Get the logged-in user's information from the authentication middleware.
    const user = response.locals.user as { id?: string } | undefined;

    // Return an error if the user is not authenticated.
    if (!user?.id) {
      return response.status(401).json({ error: "Authentication required." });
    }

    try {
      // Get all events assigned to the logged-in organizer.
      const rows = await deps.findEventsByOrganizer(user.id);

      // Get the current date and time.
      const now = deps.now ? deps.now() : new Date();

      // Return the events with their details and current statuses.
      return response.status(200).json(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          date: row.startsAt,
          venue: row.venue,

          // Determine whether each event is Upcoming, Live, or Ended.
          status: getEventStatus(new Date(row.startsAt), new Date(row.endsAt), now),

          reportedPhotosCount: row.reportedPhotosCount
        }))
      );
    } catch {
      // Return an error if the events could not be loaded.
      return response.status(500).json({ error: "Could not load your events." });
    }
  };
}