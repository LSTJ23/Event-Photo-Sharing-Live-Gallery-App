"use client";

import Link from "next/link";
import { ChartIcon, ChevronRightIcon, FlagIcon, GalleryIcon, QrIcon } from "@/components/icons";
import { PageHeading } from "@/components/organizer/PageHeading";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import styles from "@/components/organizer.module.css";

/** The organizer's events, each with Gallery, Analytics and QR code, and any reported photos to review. */
export default function EventsPage() {
  const { events: allEvents, pendingCount } = useOrganizerStore();
  // Ended events live on the Past events page.
  const events = allEvents.filter((e) => e.status !== "ENDED");

  return (
    <>
      <PageHeading title="Events" count={events.length} />
      {events.length === 0 ? (
        <p className={styles.empty}>No live or upcoming events.</p>
      ) : (
        <div className={styles.eventsGrid}>
          {events.map((event) => {
            const reported = pendingCount(event.id);
            const live = event.status === "LIVE";
            return (
              <section key={event.id} className={`${styles.card} ${styles.cardClickable}`} aria-labelledby={`event-${event.id}`}>
                <div className={styles.cardHead}>
                  <div>
                    <h2 id={`event-${event.id}`} className={styles.cardName}>
                      <Link href={`/events/${event.id}/gallery`} className={styles.cardLink}>
                        {event.name}
                      </Link>
                    </h2>
                    <p className={styles.pageSub}>
                      {event.when} · {event.venue}
                    </p>
                  </div>
                  <span className={`${styles.status} ${live ? styles.statusLive : styles.statusUpcoming}`}>
                    {event.status}
                  </span>
                </div>

                <div className={styles.actions}>
                  <Link href={`/events/${event.id}/gallery`} className={styles.action}>
                    <GalleryIcon size={20} />
                    Gallery
                  </Link>
                  <Link href={`/events/${event.id}/analytics`} className={styles.action}>
                    <ChartIcon />
                    Analytics
                  </Link>
                  <Link href={`/events/${event.id}/qr`} className={styles.action}>
                    <QrIcon />
                    QR code
                  </Link>
                </div>

                {reported > 0 && (
                  <Link href="/reports" className={styles.reportBar}>
                    <span className={styles.reportBarText}>
                      <FlagIcon />
                      {reported} reported {reported === 1 ? "photo" : "photos"}
                    </span>
                    <span className={styles.reportBarAction}>
                      Review <ChevronRightIcon size={14} />
                    </span>
                  </Link>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
