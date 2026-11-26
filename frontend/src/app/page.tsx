import { redirect } from "next/navigation";

// Participants join from an event link or QR code; staff can use the portal.
export default function Home() {
  redirect("/portal");
}

