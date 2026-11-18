
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { validateOrganizerInput, type OrganizerInput } from "../organizerValidation.js";

export interface Organizer extends OrganizerInput {
  id: string;
  createdAt: string;
}

export class DuplicateOrganizerError extends Error {
  constructor() {
    super("An organizer with this name already exists.");
  }
}

// Stores organizer information.
export interface OrganizerStore {
  create(input: OrganizerInput): Promise<Organizer>;
}

// Temporary in-memory store until Supabase is implemented.
export function createPlaceholderOrganizerStore(): OrganizerStore {
  const organizers: Organizer[] = [];

  return {
    async create(input) {
      const taken = organizers.some(
        (organizer) => organizer.organizerName.toLowerCase() === input.organizerName.toLowerCase()
      );
      if (taken) throw new DuplicateOrganizerError();

      const organizer: Organizer = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
      organizers.push(organizer);
      return organizer;
    }
  };
}

// Handles POST /organizers.
export function createOrganizerController(store: OrganizerStore) {
  return async function createOrganizer(request: Request, response: Response) {
    const result = validateOrganizerInput(request.body);

    if (!result.valid) {
      response.status(400).json({ errors: result.errors });
      return;
    }

    try {
      const organizer = await store.create(result.data);
      response.status(201).json({ organizer });
    } catch (error) {
      if (error instanceof DuplicateOrganizerError) {
        response.status(409).json({ errors: { organizerName: error.message } });
        return;
      }

      console.error("Failed to create organizer:", error);
      response.status(500).json({ error: "Could not create the organizer. Please try again." });
    }
  };
}