// Checks the input for creating an organizer account.

export const MAX_NAME_LENGTH = 100;

// Defines the required fields for an organizer.
export interface OrganizerInput {
  organizerName: string;
  personName: string;
}

// Stores validation error messages for each field.
export type OrganizerErrors = Partial<Record<keyof OrganizerInput, string>>;

// Defines the possible results of input validation.
export type OrganizerValidationResult =
  | { valid: true; data: OrganizerInput }
  | { valid: false; errors: OrganizerErrors };

// Checks if a name is valid.
function checkName(value: unknown, label: string): { value?: string; error?: string } {
  // Checks if the value is a string and is not empty.
  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${label} is required.` };
  }

  // Removes spaces at the beginning and end of the name.
  const trimmed = value.trim();

  // Checks if the name exceeds the allowed length.
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { error: `${label} must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }

  // Returns the cleaned name if it is valid.
  return { value: trimmed };
}

// Validates the organizer form input.
export function validateOrganizerInput(body: unknown): OrganizerValidationResult {
  // Uses an empty object if the submitted input is not an object.
  const source = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

  // Validates both required fields.
  const organizerName = checkName(source.organizerName, "Organizer name");
  const personName = checkName(source.personName, "Person name");

  // Collects any validation errors.
  const errors: OrganizerErrors = {};
  if (organizerName.error) errors.organizerName = organizerName.error;
  if (personName.error) errors.personName = personName.error;

  // Returns all errors if at least one field is invalid.
  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  // Returns the cleaned input if both fields are valid.
  return {
    valid: true,
    data: {
      organizerName: organizerName.value as string,
      personName: personName.value as string
    }
  };
}