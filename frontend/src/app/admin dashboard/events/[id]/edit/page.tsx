import { notFound } from "next/navigation";
import EventForm from "@/components/admin/EventForm";
import PageHeader from "@/components/admin/PageHeader";
import { events } from "@/lib/data";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = events.find((e) => e.id === id);
  if (!event) notFound();

  return (
    <div className="page">
      <PageHeader title="Edit Event" />
      <div className="body">
        <EventForm
          mode="edit"
          id={event.id}
          // Placeholder: map your real record's fields here (venue, organizer, hashtag, capacity, startsAt).
          defaultValues={{ name: event.name }}
        />
      </div>
    </div>
  );
}
