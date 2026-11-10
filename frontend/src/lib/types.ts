export interface EventInfo {
  /** URL-friendly id, also what the event QR code points to. */
  id: string;
  name: string;
  /** Calendar date of the event, as YYYY-MM-DD. */
  date: string;
  /** Where the event takes place, e.g. "Manila". */
  location?: string;
  /** Whether the public share link (and QR code) currently lets people in. */
  shareLinkActive: boolean;
}

export interface Photo {
  id: string;
  eventId: string;
  url: string;
  /** Name of whoever shared it, or "Anonymous" if they chose to hide it. */
  sharedBy: string;
  /** ISO 8601 timestamp of when it was shared. */
  createdAt: string;
}
