// Checks the input for creating an organizer account.

export const MAX_NAME_LENGTH = 100;

export interface OrganizerInput {
  organizerName: string;
  personName: string;
}

export type OrganizerErrors = Partial<Record<keyof OrganizerInput, string>>;

export type OrganizerValidationResult =
  | { valid: true; data: OrganizerInput }
  | { valid: false; errors: OrganizerErrors };

// Checks if a name is valid.
function checkName(value: unknown, label: string): { value?: string; error?: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${label} is required.` };
  }

  const trimmed = value.trim();

  if (trimmed.length > MAX_NAME_LENGTH) {
    return { error: `${label} must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }

  return { value: trimmed };
}

// Validates the organizer form input.
export function validateOrganizerInput(body: unknown): OrganizerValidationResult {
  const source = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

  const organizerName = checkName(source.organizerName, "Organizer name");
  const personName = checkName(source.personName, "Person name");

  const errors: OrganizerErrors = {};
  if (organizerName.error) errors.organizerName = organizerName.error;
  if (personName.error) errors.personName = personName.error;

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      organizerName: organizerName.value as string,
      personName: personName.value as string
    }
  };
}