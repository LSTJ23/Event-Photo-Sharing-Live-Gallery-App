// Placeholder data layer. Replace these with real API / database calls.

export type EventItem = { id: string; name: string };
export type OrgItem = { id: string; name: string };

export const events: EventItem[] = [
  { id: "1", name: "Event 1" },
  { id: "2", name: "Event 2" },
  { id: "3", name: "Event 3" },
];

export const orgs: OrgItem[] = [
  { id: "1", name: "Org 1" },
  { id: "2", name: "Org 2" },
  { id: "3", name: "Org 3" },
];

export function getStats() {
  return { totalEvents: 0, activeEvents: 0, activeUsers: 0 };
}

export function getTopOrganizers(): string[] {
  return [];
}
