"use client";

import { DashboardShell } from "../DashboardShell";
import { useOrganizerStore } from "./OrganizerStore";

/** The organizer dashboard's frame: Events, Reported photos (with unread count) and Log out. */
export function OrganizerShell({ children }: { children: React.ReactNode }) {
  const { unreadCount, toast } = useOrganizerStore();
  return (
    <DashboardShell
      role="Organizer"
      homeHref="/events"
      toast={toast}
      links={[
        { href: "/events", label: "Events" },
        { href: "/reports", label: "Reported photos", badge: unreadCount },
        { href: "/login", label: "Log out" }
      ]}
    >
      {children}
    </DashboardShell>
  );
}
