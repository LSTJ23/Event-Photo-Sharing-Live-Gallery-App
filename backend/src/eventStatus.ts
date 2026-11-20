// Possible statuses for an event.
export type EventStatus = "Live" | "Upcoming" | "Ended";

// Check the event's status based on its start and end times.
export function getEventStatus(startsAt: Date, endsAt: Date, now: Date = new Date()): EventStatus {
  // The event has not started yet.
  if (now < startsAt) return "Upcoming";

  // The event has started but has not ended yet.
  if (now < endsAt) return "Live";

  // The event's end time has already passed.
  return "Ended";
}