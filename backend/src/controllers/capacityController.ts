import type { Request, Response } from "express";
import { isUploadAllowed, isValidCapacity } from "../capacity.js";

export interface CapacityDeps {
  // Updates the event's capacity and returns its current usage.
  // Returns null if the event does not exist.
  updateCapacity(
    eventId: string,
    maxCapacity: number
  ): Promise<{ currentCount: number; maxCapacity: number } | null>;
}

export function createCapacityHandler(deps: CapacityDeps) {
  return async (request: Request, response: Response) => {
    // Get the event ID from the URL.
    const eventId = String(request.params.id ?? "").trim();

    // Check if the event ID is provided.
    if (!eventId) {
      return response.status(400).json({ error: "Event id is required." });
    }

    // Get the new capacity from the request body.
    const { maxCapacity } = (request.body ?? {}) as { maxCapacity?: unknown };

    // Check if the capacity is a positive whole number.
    if (!isValidCapacity(maxCapacity)) {
      return response.status(400).json({ error: "maxCapacity must be a positive whole number." });
    }

    try {
      // Update the event's capacity in the database.
      const usage = await deps.updateCapacity(eventId, maxCapacity);

      // Return an error if the event does not exist.
      if (!usage) {
        return response.status(404).json({ error: "Event not found." });
      }

      // Return the updated capacity and current usage.
      return response.status(200).json({
        eventId,
        currentCount: usage.currentCount,
        maxCapacity: usage.maxCapacity,
        usage: `${usage.currentCount}/${usage.maxCapacity}`,
        uploadsOpen: isUploadAllowed(usage.currentCount, usage.maxCapacity)
      });
    } catch {
      // Return an error if the capacity update fails.
      return response.status(500).json({ error: "Could not update the capacity." });
    }
  };
}