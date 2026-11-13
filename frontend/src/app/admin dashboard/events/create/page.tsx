import EventForm from "@/components/admin/EventForm";
import PageHeader from "@/components/admin/PageHeader";

export default function CreateEventPage() {
  return (
    <div className="page">
      <PageHeader title="Create Event" />
      <div className="body">
        <EventForm mode="create" />
      </div>
    </div>
  );
}
