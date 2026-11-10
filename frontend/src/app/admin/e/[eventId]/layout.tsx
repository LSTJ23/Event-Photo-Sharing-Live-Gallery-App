import { EventSession } from "@/components/EventSession";
import { OrganizerOnly } from "@/components/OrganizerOnly";

// Organizer pages for one event: /admin/e/<eventId> (gallery) and
// /admin/e/<eventId>/manage. Only organizers can open them (see OrganizerOnly);
// the backend must also check this.
export default async function AdminEventLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return (
    <OrganizerOnly>
      <EventSession eventId={eventId} variant="admin">
        {children}
      </EventSession>
    </OrganizerOnly>
  );
}
