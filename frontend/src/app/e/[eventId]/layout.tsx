import { EventSession } from "@/components/EventSession";

// Wraps every screen under /e/<eventId>/… so they share the event details and
// the photo the participant is about to share.
export default async function EventLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventSession eventId={eventId}>{children}</EventSession>;
}
