import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { validateOrganizerInput, type OrganizerInput } from "../organizerValidation.js";

// Defines an organizer's information, including its ID and creation date.
export interface Organizer extends OrganizerInput {
  id: string;
  createdAt: string;
}

// Error returned when an organizer name is already taken.
export class DuplicateOrganizerError extends Error {
  constructor() {
    super("An organizer with this name already exists.");
  }
}

// Stores organizer information.
export interface OrganizerStore {
  // Creates a new organizer.
  create(input: OrganizerInput): Promise<Organizer>;
}

// Temporary in-memory store until Supabase is implemented.
export function createPlaceholderOrganizerStore(): OrganizerStore {
  // Holds the organizers while the application is running.
  const organizers: Organizer[] = [];

  return {
    async create(input) {
      // Checks if another organizer already uses the same name.
      const taken = organizers.some(
        (organizer) => organizer.organizerName.toLowerCase() === input.organizerName.toLowerCase()
      );

      // Prevents creating an organizer with an existing name.
      if (taken) throw new DuplicateOrganizerError();

      // Creates a new organizer with a unique ID and creation date.
      const organizer: Organizer = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };

      // Saves the new organizer in the list.
      organizers.push(organizer);
      return organizer;
    }
  };
}

// Handles POST /organizers.
export function createOrganizerController(store: OrganizerStore) {
  return async function createOrganizer(request: Request, response: Response) {
    // Checks if the submitted organizer information is valid.
    const result = validateOrganizerInput(request.body);

    // Returns validation errors if the input is invalid.
    if (!result.valid) {
      response.status(400).json({ errors: result.errors });
      return;
    }

    try {
      // Saves the new organizer and returns its information.
      const organizer = await store.create(result.data);
      response.status(201).json({ organizer });
    } catch (error) {
      // Checks if the organizer name is already being used.
      if (error instanceof DuplicateOrganizerError) {
        response.status(409).json({ errors: { organizerName: error.message } });
        return;
      }

      // Logs unexpected errors and sends a server error response.
      console.error("Failed to create organizer:", error);
      response.status(500).json({ error: "Could not create the organizer. Please try again." });
    }
  };
}