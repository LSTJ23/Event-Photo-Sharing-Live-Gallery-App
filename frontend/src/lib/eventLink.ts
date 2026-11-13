import { eventSlug } from "./eventSlug";

/**
 * Reads the event id out of an event's share link, which is also what the
 * event's QR code holds.
 *
 * Accepts:
 * - https://example.com/e/dlsu-cso-event  (the share link)
 * - https://example.com/join?event=dlsu-cso-event
 *
 * Returns null for anything else (plain text, or a link to some other page),
 * so a QR code that isn't an event's is ignored.
 */
export function parseEventLink(raw: string): string | null {
  const text = raw.trim();
  if (!/^https?:\/\//i.test(text)) return null;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }

  const fromQuery = url.searchParams.get("event");
  if (fromQuery) return eventSlug(fromQuery) || null;

  const segments = url.pathname.split("/").filter(Boolean);
  const marker = segments.indexOf("e");
  if (marker !== -1 && segments[marker + 1]) {
    return eventSlug(decodeURIComponent(segments[marker + 1])) || null;
  }
  return null;
}
