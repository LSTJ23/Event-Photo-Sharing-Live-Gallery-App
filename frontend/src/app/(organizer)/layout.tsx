import { OrganizerOnly } from "@/components/OrganizerOnly";
import { OrganizerShell } from "@/components/organizer/OrganizerShell";
import { OrganizerStoreProvider } from "@/components/organizer/OrganizerStore";

// The organizer dashboard: /events, /reports and /login. The "(organizer)"
// folder groups these pages under their own top bar and styles without adding
// anything to their web addresses, and keeps them apart from the participant
// (phone) and admin pages.
export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizerOnly>
      <OrganizerStoreProvider>
        <OrganizerShell>{children}</OrganizerShell>
      </OrganizerStoreProvider>
    </OrganizerOnly>
  );
}
