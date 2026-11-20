import type { Request, Response } from "express";
import { validateOrganizerInput } from "../organizerValidation.js";
import { DuplicateOrganizerError, type OrganizerStore } from "../organizerStore.js";

// Handles GET /organizers?search=...
// An empty list means no organizer matches, so the frontend can show its empty message.
export function listOrganizersController(store: OrganizerStore) {
  return async function listOrganizers(request: Request, response: Response) {
    // Gets the search text from the query parameters.
    const search = typeof request.query.search === "string" ? request.query.search : undefined;

    try {
      // Gets the organizers that match the search text.
      const organizers = await store.list(search);
      response.status(200).json({ organizers });
    } catch (error) {
      // Returns an error if loading the organizers fails.
      console.error("Failed to list organizers:", error);
      response.status(500).json({ error: "Could not load the organizers. Please try again." });
    }
  };
}

// Handles GET /organizers/:id. Used to pre-fill the Edit User page.
export function getOrganizerController(store: OrganizerStore) {
  return async function getOrganizer(request: Request, response: Response) {
    try {
      // Gets the organizer using the ID from the URL.
      const organizer = await store.getById(String(request.params.id));

      // Returns 404 if the organizer does not exist.
      if (!organizer) {
        response.status(404).json({ error: "Organizer not found." });
        return;
      }

      // Returns the organizer's information.
      response.status(200).json({ organizer });
    } catch (error) {
      // Returns an error if loading the organizer fails.
      console.error("Failed to get organizer:", error);
      response.status(500).json({ error: "Could not load the organizer. Please try again." });
    }
  };
}

// Handles PATCH /organizers/:id.
// Same required fields and rules as create, so both names must be sent.
export function updateOrganizerController(store: OrganizerStore) {
  return async function updateOrganizer(request: Request, response: Response) {
    // Checks if the submitted organizer information is valid.
    const result = validateOrganizerInput(request.body);

    // Returns validation errors if the input is invalid.
    if (!result.valid) {
      response.status(400).json({ errors: result.errors });
      return;
    }

    try {
      // Updates the organizer using the ID from the URL.
      const organizer = await store.update(String(request.params.id), result.data);

      // Returns 404 if the organizer does not exist.
      if (!organizer) {
        response.status(404).json({ error: "Organizer not found." });
        return;
      }

      // Returns the updated organizer.
      response.status(200).json({ organizer });
    } catch (error) {
      // Returns 409 if the organizer name is already being used.
      if (error instanceof DuplicateOrganizerError) {
        response.status(409).json({ errors: { organizerName: error.message } });
        return;
      }

      // Returns an error if updating the organizer fails.
      console.error("Failed to update organizer:", error);
      response.status(500).json({ error: "Could not update the organizer. Please try again." });
    }
  };
}