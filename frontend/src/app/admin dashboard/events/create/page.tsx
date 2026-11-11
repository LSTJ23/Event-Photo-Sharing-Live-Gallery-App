import EventForm from "@/components/EventForm";
import PageHeader from "@/components/PageHeader";

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
