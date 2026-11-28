"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/AdminShell";
import { useBackTo } from "@/components/admin/useBackTo";
import { useAdminStore } from "@/components/admin/AdminStore";
import { emptyEventForm, EventFormView } from "@/components/admin/EventFormView";
import styles from "@/components/admin/dashboard.module.css";

/** Create an event and assign an organizer. */
export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useAdminStore();
  const back = useBackTo("/admin");
  const afterSave = useBackTo("/admin/events");

  const handleSubmit = async (form: Parameters<typeof createEvent>[0]) => {
    await createEvent(form);
    router.push(afterSave);
  };

  return (
    <div className={`${styles.centered} ${styles.centeredWide}`}>
      <PageHeader title="Create Event" back={back} subtitle="Assign an active organizer. Email invitations are not yet available." />
      <EventFormView
        initial={emptyEventForm}
        submitLabel="Create event"
        cancelHref={back}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
