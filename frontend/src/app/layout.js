import "./globals.css";
import StoreProvider from "@/components/StoreProvider";
import Shell from "@/components/Shell";

export const metadata = { title: "Event organizer dashboard" };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider><Shell>{children}</Shell></StoreProvider>
      </body>
    </html>
  );
}
