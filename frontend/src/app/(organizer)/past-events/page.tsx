"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DownloadPhotosButton } from "@/components/DownloadPhotosButton";
import { ArchiveIcon, GalleryIcon, RestoreIcon, TrashIcon } from "@/components/icons";
import { PageHeading } from "@/components/organizer/PageHeading";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import styles from "@/components/organizer.module.css";
import type { OrganizerEvent } from "@/lib/organizerData";


/**
 * Events that have ended. For each: open the gallery, download all photos,
 * archive it (tuck it away; it can be restored) or delete it for good.
 */
export default function PastEventsPage() {
  // useSearchParams needs a Suspense boundary in the Next.js App Router.
  return (
    <Suspense fallback={null}>
      <PastEvents />
    </Suspense>
  );
}

function PastEvents() {
  const { events, notify, archiveEvent, restoreEvent, deleteEvent } = useOrganizerStore();
  const tab = useSearchParams().get("tab") === "archived" ? "archived" : "past";
  const [deleting, setDeleting] = useState<OrganizerEvent | null>(null);
  const [archiving, setArchiving] = useState<{ event: OrganizerEvent; restore: boolean } | null>(null);
  const ended = events.filter((e) => e.status === "ENDED");
  const pastCount = ended.filter((e) => !e.archived).length;
  const shown = ended.filter((e) => (tab === "archived" ? e.archived : !e.archived));

  return (
    <>
      <PageHeading title="Past events" count={ended.length} />
      <div className={styles.segmented} role="tablist" aria-label="Which past events">
        <Link href="/past-events" role="tab" aria-selected={tab === "past"}>
          Past · {pastCount}
        </Link>
        <Link href="/past-events?tab=archived" role="tab" aria-selected={tab === "archived"}>
          Archived · {ended.length - pastCount}
        </Link>
      </div>

      {shown.length === 0 ? (
        <p className={styles.empty}>
          {tab === "past" ? "No past events. Events show up here once they end." : "No archived events."}
        </p>
      ) : (
        <div className={styles.eventsGrid}>
          {shown.map((event) => (
            <section key={event.id} className={`${styles.card} ${styles.cardClickable}`} aria-labelledby={`past-${event.id}`}>
              <div className={styles.cardHead}>
                <div>
                  <h2 id={`past-${event.id}`} className={styles.cardName}>
                    <Link href={`/events/${event.id}/gallery`} className={styles.cardLink}>
                      {event.name}
                    </Link>
                  </h2>
                  <p className={styles.pageSub}>
                    {event.when} · {event.venue} · {event.photos.length} {event.photos.length === 1 ? "photo" : "photos"}
                  </p>
                </div>
                <span className={`${styles.status} ${styles.statusUpcoming}`}>{event.archived ? "Archived" : "Ended"}</span>
              </div>

              <div className={styles.pastActions}>
                <DownloadPhotosButton
                  eventId={event.id}
                  eventName={event.name}
                  className={`${styles.btnDark} ${styles.pastDownload}`}
                  onDone={notify}
                />
                <Link href={`/events/${event.id}/gallery`} className={styles.btn}>
                  <GalleryIcon size={18} /> Gallery
                </Link>
                {event.archived ? (
                  <button type="button" className={styles.btn} onClick={() => setArchiving({ event, restore: true })}>
                    <RestoreIcon /> Restore
                  </button>
                ) : (
                  <button type="button" className={styles.btn} onClick={() => setArchiving({ event, restore: false })}>
                    <ArchiveIcon /> Archive
                  </button>
                )}
                <button type="button" className={styles.btnDangerOutline} onClick={() => setDeleting(event)}>
                  <TrashIcon /> Delete
                </button>
              </div>
            </section>
          ))}
        </div>
      )}

      {archiving && (
        <ConfirmDialog
          title={`${archiving.restore ? "Restore" : "Archive"} ${archiving.event.name}?`}
          text={
            archiving.restore
              ? "It moves back to Past events."
              : "It moves to the Archived tab. Its photos are kept, and you can restore it anytime."
          }
          confirmLabel={archiving.restore ? "Restore" : "Archive"}
          icon={archiving.restore ? <RestoreIcon size={20} /> : <ArchiveIcon size={20} />}
          onConfirm={() => {
            if (archiving.restore) restoreEvent(archiving.event.id);
            else archiveEvent(archiving.event.id);
            setArchiving(null);
          }}
          onClose={() => setArchiving(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          text="The event and all its photos will be deleted for everyone. Download the photos first if you want to keep them. This can't be undone."
          confirmLabel="Delete event"
          danger
          icon={<TrashIcon size={20} />}
          onConfirm={() => {
            deleteEvent(deleting.id);
            setDeleting(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
