// Reasons a participant can pick when reporting a photo (the dropdown on the
// single-photo screen). "Other" asks for a few words.
export const REPORT_REASONS = [
  "Inappropriate content",
  "Spam",
  "Not from this event",
  "I'm in it and want it removed",
  "Offensive or hateful",
  "Other"
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const DETAILS_MAX = 200;

/** What's wrong with the report form, or null when it can be sent. */
export function reportFormError(reason: string, details: string): string | null {
  if (!REPORT_REASONS.includes(reason as ReportReason)) return "Choose a reason.";
  if (reason === "Other" && !details.trim()) return "Tell us a little about what's wrong.";
  if (details.length > DETAILS_MAX) return `Keep it under ${DETAILS_MAX} characters.`;
  return null;
}
