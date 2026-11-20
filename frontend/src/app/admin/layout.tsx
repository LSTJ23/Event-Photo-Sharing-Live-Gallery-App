import { AdminShell } from "@/components/admin/AdminShell";
import { AdminOnly } from "@/components/OrganizerOnly";

// The admin dashboard: /admin, /admin/events (+ create, edit), /admin/users (+ create, edit), /admin/reports, /admin/analytics.
// Only admins can open it (see AdminOnly); the backend must also check this.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminOnly>
      <AdminShell>{children}</AdminShell>
    </AdminOnly>
  );
}
