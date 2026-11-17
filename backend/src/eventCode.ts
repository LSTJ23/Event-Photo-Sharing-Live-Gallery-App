import { randomBytes } from "node:crypto";

// Generates a random code for the event's public link.
export function generateEventCode(): string {
  return randomBytes(8).toString("base64url");
}

// Gets today's date in Manila using YYYY-MM-DD format.
export function todayInManila(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}