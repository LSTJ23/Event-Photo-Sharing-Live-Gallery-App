import { redirect } from "next/navigation";

// The event's public share link (and what its QR code holds): /e/<eventId>.
// Keep the event in the URL while participants enter their details.
export default async function EventLinkPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  redirect(`/portal?event=${encodeURIComponent(eventId)}`);
}
