"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/AdminShell";
import { useAdminStore } from "@/components/admin/AdminStore";
import { emptyEventForm, EventFormView } from "@/components/admin/EventFormView";
import styles from "@/components/admin/dashboard.module.css";

/** Create an event and choose the organizer, who gets invited to it. */
export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useAdminStore();
  return (
    <div className={`${styles.centered} ${styles.centeredWide}`}>
      <PageHeader title="Create Event" back="/admin" subtitle="The organizer you choose will be invited to run this event." />
      <EventFormView
        initial={emptyEventForm}
        submitLabel="Create event"
        cancelHref="/admin"
        onSubmit={(form) => {
          createEvent(form);
          router.push("/admin/events");
        }}
      />
    </div>
  );
}
