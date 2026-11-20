import { EventSession } from "@/components/EventSession";

// The organizer's gallery for one event: /events/<id>/gallery and
// /events/<id>/gallery/manage, inside the organizer dashboard's frame.
export default async function EventGalleryLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <EventSession eventId={id} variant="admin">
      {children}
    </EventSession>
  );
}
