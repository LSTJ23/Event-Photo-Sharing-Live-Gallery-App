import { randomUUID } from "node:crypto";
import type { OrganizerInput } from "./organizerValidation.js";

// Stores the organizer's information along with its ID and creation date.
export interface Organizer extends OrganizerInput {
  id: string;
  createdAt: string;
}

// Error thrown when an organizer name is already being used.
export class DuplicateOrganizerError extends Error {
  constructor() {
    super("An organizer with this name already exists.");
  }
}

// Defines the functions that the organizer store must provide.
// The in-memory store can later be replaced with a Supabase implementation.
export interface ManagedOrganizerStore {
  // Adds a new organizer.
  create(input: OrganizerInput): Promise<Organizer>;
  // Returns organizers whose name contains `search` (case-insensitive), sorted A-Z.
  // No search text returns everyone.
  list(search?: string): Promise<Organizer[]>;
  // Gets an organizer using its ID.
  // Returns null if the organizer does not exist.
  getById(id: string): Promise<Organizer | null>;
  // Updates an organizer's information using its ID.
  // Returns null if the organizer does not exist.
  update(id: string, input: OrganizerInput): Promise<Organizer | null>;
}

// Temporary in-memory store until Supabase is implemented.
// create() is included so one store can serve both the create route and the manage routes.
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

      // Saves the organizer in the list.
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