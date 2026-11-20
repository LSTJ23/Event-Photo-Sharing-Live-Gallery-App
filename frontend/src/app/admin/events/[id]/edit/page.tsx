"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/AdminShell";
import { useAdminStore } from "@/components/admin/AdminStore";
import { EventFormView } from "@/components/admin/EventFormView";
import styles from "@/components/admin/dashboard.module.css";

/** Edit an event's details. Changing the organizer invites the new one. */
export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getEvent, updateEvent } = useAdminStore();
  const event = getEvent(id);

  if (!event) {
    return (
      <>
        <PageHeader title="Event not found" back="/admin/events" subtitle="It may have been deleted, or the link is wrong." />
        <Link href="/admin/events" className={styles.btn} style={{ alignSelf: "flex-start" }}>
          Back to events
        </Link>
      </>
    );
  }

  return (
    <div className={`${styles.centered} ${styles.centeredWide}`}>
      <PageHeader title="Edit Event" back="/admin/events" subtitle={event.name} />
      <EventFormView
        initial={{
          name: event.name,
          venue: event.venue,
          organizerId: event.organizerId,
          hashtag: event.hashtag,
          capacity: String(event.capacity),
          date: event.date,
          time: event.time,
          endDate: event.endDate || event.date,
          endTime: event.endTime
        }}
        minCapacity={Math.max(1, event.photoCount)}
        submitLabel="Save changes"
        cancelHref="/admin/events"
        onSubmit={(form) => {
          updateEvent(event.id, form);
          router.push("/admin/events");
        }}
      />
    </div>
  );
}
