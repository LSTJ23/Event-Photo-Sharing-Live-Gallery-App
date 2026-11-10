import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Photo Sharing",
  description: "A live photo gallery for your event."
};

// Phone-first: fit the screen width, don't zoom, and draw edge to edge on
// notched phones (screens pad themselves with the safe-area insets).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
