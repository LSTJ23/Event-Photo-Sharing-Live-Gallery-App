import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Photo Sharing",
  description: "A live photo gallery for your event."
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
