import { redirect } from "next/navigation";

// The event's public share link (and what its QR code holds): /e/<eventId>.
// It takes participants straight to the camera, skipping the QR scanner.
// If the event doesn't exist, the camera page shows "Event not found".
export default async function EventLinkPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  redirect(`/e/${encodeURIComponent(eventId)}/camera`);
}
