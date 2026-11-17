export interface ValidEvent {
  name: string;
  date: string; // Event date in YYYY-MM-DD format
  venue: string | null;
  organizerId: string;
  maxCapacity: number | null; // Null means there is no capacity limit
}

export type EventField = "name" | "date" | "organizerId" | "venue" | "maxCapacity";

export type ValidationResult =
  | { ok: true; value: ValidEvent }
  | { ok: false; fields: Partial<Record<EventField, string>> };

// Checks if the date follows YYYY-MM-DD and exists on the calendar.
function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Makes sure JavaScript did not change the date to an invalid one.
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Checks the event details and returns either valid data or field errors.
export function validateNewEvent(input: unknown, today: string): ValidationResult {
  // Makes sure the input is an object before reading its fields.
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const fields: Partial<Record<EventField, string>> = {};

  // Checks that the event name is present and within the character limit.
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) fields.name = "Name is required.";
  else if (name.length > 100) fields.name = "Name must be 100 characters or fewer.";

  // Checks that the date is valid and is not earlier than today.
  const date = typeof body.date === "string" ? body.date.trim() : "";
  if (body.date === undefined || body.date === null || date === "") {
    fields.date = "Date is required.";
  } else if (!isRealDate(date)) {
    fields.date = "Date is invalid. Use YYYY-MM-DD.";
  } else if (date < today) {
    fields.date = "Date cannot be in the past.";
  }

  // Checks that an organizer has been assigned.
  const organizerId = typeof body.organizerId === "string" ? body.organizerId.trim() : "";
  if (!organizerId) fields.organizerId = "Assigned organizer is required.";

  // Checks the venue if one was provided.
  let venue: string | null = null;
  if (body.venue !== undefined && body.venue !== null && body.venue !== "") {
    if (typeof body.venue !== "string") fields.venue = "Venue must be text.";
    else if (body.venue.trim().length > 150) fields.venue = "Venue must be 150 characters or fewer.";
    else venue = body.venue.trim() || null;
  }

  // Checks that the capacity is a positive whole number if provided.
  let maxCapacity: number | null = null;
  if (body.maxCapacity !== undefined && body.maxCapacity !== null) {
    if (typeof body.maxCapacity === "number" && Number.isSafeInteger(body.maxCapacity) && body.maxCapacity > 0) {
      maxCapacity = body.maxCapacity;
    } else {
      fields.maxCapacity = "Capacity must be a positive whole number.";
    }
  }

  // Returns all validation errors or the cleaned event details.
  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, value: { name, date, venue, organizerId, maxCapacity } };
}