import ManageList from "@/components/admin/ManageList";
import PageHeader from "@/components/admin/PageHeader";
import { events } from "@/lib/data";

export default function ManageEventsPage() {
  const items = events.map((e) => ({
    id: e.id,
    name: e.name,
    actions: [
      { label: "Edit", href: `/admin%20dashboard/events/${e.id}/edit` },
      { label: "Gallery", href: `/admin/e/${e.id}` },
      { label: "QR", href: `/events/${e.id}/qr` },
    ],
  }));

  return (
    <div className="page">
      <PageHeader title="Manage Events" />
      <div className="body">
        <ManageList items={items} addHref="/admin%20dashboard/events/create" emptyText="No events found" />
      </div>
    </div>
  );
}
