"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/AdminShell";
import { useBackTo } from "@/components/admin/useBackTo";
import { useAdminStore } from "@/components/admin/AdminStore";
import { emptyEventForm, EventFormView } from "@/components/admin/EventFormView";
import styles from "@/components/admin/dashboard.module.css";

/** Create an event and choose the organizer, who gets invited to it. */
export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useAdminStore();
  const back = useBackTo("/admin");
  const afterSave = useBackTo("/admin/events");
  return (
    <div className={`${styles.centered} ${styles.centeredWide}`}>
      <PageHeader title="Create Event" back={back} subtitle="The organizer you choose will be invited to run this event." />
      <EventFormView
        initial={emptyEventForm}
        submitLabel="Create event"
        cancelHref={back}
        onSubmit={(form) => {
          createEvent(form);
          router.push(afterSave);
        }}
      />
    </div>
  );
}
