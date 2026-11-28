"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/AdminShell";
import { useBackTo } from "@/components/admin/useBackTo";
import { useAdminStore } from "@/components/admin/AdminStore";
import { EventFormView } from "@/components/admin/EventFormView";
import styles from "@/components/admin/dashboard.module.css";

/** Edit an event's details. */
export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getEvent, updateEvent, loading, loadError } = useAdminStore();
  const event = getEvent(id);
  const back = useBackTo("/admin/events");

  if (loading) return <p role="status">Loading event...</p>;
  if (loadError) return <p role="alert">{loadError}</p>;
  if (!event) {
    return (
      <>
        <PageHeader title="Event not found" back={back} subtitle="It may have been deleted, or the link is wrong." />
        <Link href={back} className={styles.btn} style={{ alignSelf: "flex-start" }}>
          Go back
        </Link>
      </>
    );
  }

  return (
    <div className={`${styles.centered} ${styles.centeredWide}`}>
      <PageHeader title="Edit Event" back={back} subtitle={event.name} />
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
        cancelHref={back}
        onSubmit={async (form) => {
          await updateEvent(event.id, form);
          router.push(back);
        }}
      />
    </div>
  );
}
