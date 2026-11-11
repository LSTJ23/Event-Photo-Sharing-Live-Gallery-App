import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Event and user administration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="screen">{children}</main>
      </body>
    </html>
  );
}
