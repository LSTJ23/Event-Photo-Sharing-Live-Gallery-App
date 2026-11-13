import ManageList from "@/components/ManageList";
import PageHeader from "@/components/PageHeader";
import { events } from "@/lib/data";

export default function ManageEventsPage() {
  const items = events.map((e) => ({
    id: e.id,
    name: e.name,
    actions: [
      { label: "Edit", href: `/events/${e.id}/edit` },
      { label: "Gallery", href: `/events/${e.id}/gallery` },
      { label: "QR", href: `/events/${e.id}/qr` },
    ],
  }));

  return (
    <div className="page">
      <PageHeader title="Manage Events" />
      <div className="body">
        <ManageList items={items} addHref="/events/create" emptyText="No events found" />
      </div>
    </div>
  );
}
