"use client";

import { DashboardShell } from "../DashboardShell";
import { ArchiveIcon, CalendarIcon, FlagIcon } from "../icons";
import { useOrganizerStore } from "./OrganizerStore";

/** The organizer dashboard's frame: sidebar with Events, Past events and Reported photos (with unread count). Log out is at the bottom of the sidebar. */
export function OrganizerShell({ children }: { children: React.ReactNode }) {
  const { unreadCount, toast } = useOrganizerStore();
  return (
    <DashboardShell
      role="Organizer"
      homeHref="/events"
      toast={toast}
      links={[
        { href: "/events", label: "Events", icon: <CalendarIcon size={20} /> },
        { href: "/past-events", label: "Past events", icon: <ArchiveIcon size={20} /> },
        { href: "/reports", label: "Reported photos", icon: <FlagIcon size={20} />, badge: unreadCount }
      ]}
    >
      {children}
    </DashboardShell>
  );
}