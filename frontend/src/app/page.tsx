import { redirect } from "next/navigation";

// Participants start by scanning the event QR code.
export default function Home() {
  redirect("/scan");
}

