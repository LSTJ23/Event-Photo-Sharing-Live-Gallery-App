import { randomUUID } from "node:crypto";
import {
  DuplicateOrganizerError,
  type Organizer,
  type OrganizerStore
} from "./controllers/createOrganizerController.js";
import type { OrganizerInput } from "./organizerValidation.js";

// Everything the create controller needs, plus what the Manage Users page needs.
export interface ManagedOrganizerStore extends OrganizerStore {
  // Returns organizers whose name contains `search` (case-insensitive), sorted A-Z.
  // No search text returns everyone.
  list(search?: string): Promise<Organizer[]>;
  // Gets an organizer using its ID.
  getById(id: string): Promise<Organizer | null>;
  // Returns null when the organizer does not exist.
  update(id: string, input: OrganizerInput): Promise<Organizer | null>;
}

// Temporary in-memory store until Supabase is implemented.
// It also provides create(), so the create route and the manage routes share one list.
export function createPlaceholderManagedOrganizerStore(): ManagedOrganizerStore {
  // Holds all organizer records while the application is running.
  const organizers: Organizer[] = [];

  // Checks if another organizer already uses the same name.
  // exceptId is ignored when checking for duplicates during an update.
  function isNameTaken(name: string, exceptId?: string) {
    return organizers.some(
      (organizer) =>
        organizer.id !== exceptId && organizer.organizerName.toLowerCase() === name.toLowerCase()
    );
  }

  return {
    async create(input) {
      // Prevents creating an organizer with a name that is already taken.
      if (isNameTaken(input.organizerName)) throw new DuplicateOrganizerError();

      // Creates a new organizer with a unique ID and creation date.
      const organizer: Organizer = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
      organizers.push(organizer);
      return { ...organizer };
    },

    async list(search) {
      // Converts the search text to lowercase and removes extra spaces.
      const term = (search ?? "").trim().toLowerCase();

      // Filters organizers by name, sorts them alphabetically, and returns copies.
      return organizers
        .filter((organizer) => organizer.organizerName.toLowerCase().includes(term))
        .sort((a, b) => a.organizerName.localeCompare(b.organizerName))
        .map((organizer) => ({ ...organizer }));
    },

    async getById(id) {
      // Finds an organizer with the given ID.
      const organizer = organizers.find((item) => item.id === id);
      return organizer ? { ...organizer } : null;
    },

    async update(id, input) {
      // Finds the organizer that needs to be updated.
      const organizer = organizers.find((item) => item.id === id);
      if (!organizer) return null;

      // Prevents using a name that belongs to another organizer.
      // Allows the organizer to keep its own current name.
      // Saving an organizer under its own current name is not a duplicate.
      if (isNameTaken(input.organizerName, id)) throw new DuplicateOrganizerError();

      // Updates the organizer's information.
      organizer.organizerName = input.organizerName;
      organizer.personName = input.personName;
      return { ...organizer };
    }
  };
}