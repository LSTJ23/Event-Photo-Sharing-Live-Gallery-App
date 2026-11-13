/** The event's public share link, e.g. https://eventgallery.com/e/dlsu-cso-event */
export function shareLinkFor(origin: string, eventId: string): string {
  return `${origin.replace(/\/+$/, "")}/e/${encodeURIComponent(eventId)}`;
}

/** The link as people read it, without "https://", e.g. eventgallery.com/e/dlsu-cso-event */
export function displayLink(link: string): string {
  return link.replace(/^https?:\/\//i, "");
}
