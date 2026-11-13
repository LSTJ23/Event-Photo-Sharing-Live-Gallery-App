export const ANONYMOUS_LABEL = "Anonymous";

/** The name shown under a photo in the gallery. */
export function sharedByLabel(name: string | null | undefined, anonymous: boolean): string {
  const trimmed = name?.trim();
  return anonymous || !trimmed ? ANONYMOUS_LABEL : trimmed;
}
