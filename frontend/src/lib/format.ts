// Some Intl versions put a narrow no-break space before AM/PM; keep output plain.
const tidy = (text: string) => text.replace(/[  ]/g, " ");

/** "2026-10-14" → "October 14, 2026" */
export function formatEventDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return tidy(
    parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    })
  );
}

/** ISO timestamp → "October 14, 2026 · 7:14 PM" in the viewer's time zone (or the one given). */
export function formatPhotoTimestamp(iso: string, timeZone?: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  const day = parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone
  });
  const time = parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone
  });
  return tidy(`${day} · ${time}`);
}
