import type { Request, Response } from "express";
import { generateEventCode, todayInManila } from "../eventCode.js";
import { validateNewEvent, type ValidEvent } from "../eventValidation.js";

// Event details with an added public event code.
export interface NewEventInput extends ValidEvent {
  eventCode: string;
}

export interface CreateEventDeps {
  // Checks if the organizer exists in the database.
  organizerExists(organizerId: string): Promise<boolean>;
  // Saves the event and returns its new database ID.
  createEvent(input: NewEventInput): Promise<{ id: string }>;
  // Allows tests to provide fixed values.
  generateEventCode?: () => string;
  today?: () => string;
}

// Handles requests to create a new event.
export function createCreateEventHandler(deps: CreateEventDeps) {
  return async (request: Request, response: Response) => {
    // Gets the logged-in user's details from the authentication middleware.
    const user = response.locals.user as { id?: string; role?: string } | undefined;

    // Makes sure the user is logged in.
    if (!user?.id) {
      return response.status(401).json({ error: "Authentication required." });
    }

    // Only admins are allowed to create events.
    if (user.role !== "ADMIN") {
      return response.status(403).json({ error: "Only an admin can create events." });
    }

    // Gets today's date and checks the submitted event details.
    const today = deps.today ? deps.today() : todayInManila();
    const result = validateNewEvent(request.body, today);

    // Returns an error if any event details are invalid.
    if (!result.ok) {
      return response.status(400).json({ error: "Validation failed.", fields: result.fields });
    }

    try {
      // Makes sure the assigned organizer exists.
      if (!(await deps.organizerExists(result.value.organizerId))) {
        return response
          .status(400)
          .json({ error: "Validation failed.", fields: { organizerId: "Assigned organizer not found." } });
      }

      // Generates a unique public code for the event.
      const eventCode = (deps.generateEventCode ?? generateEventCode)();

      // Saves the event and gets its new database ID.
      const { id } = await deps.createEvent({ ...result.value, eventCode });

      // Returns the newly created event details.
      return response.status(201).json({ id, ...result.value, eventCode });
    } catch {
      // Returns an error if something goes wrong while creating the event.
      return response.status(500).json({ error: "Could not create the event." });
    }
  };
}