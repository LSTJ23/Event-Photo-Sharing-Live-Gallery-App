// This function checks if a given value is a valid capacity. 
// A valid capacity is defined as a positive integer that is safe to use in JavaScript
export function isValidCapacity(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

// This function checks if the current count of items is less than the maximum capacity allowed.
export function isUploadAllowed(currentCount: number, maxCapacity: number): boolean {
  return currentCount < maxCapacity;
}