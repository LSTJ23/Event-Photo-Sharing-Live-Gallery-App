"use client";

import { useParams } from "next/navigation";
import { PageHeading } from "@/components/organizer/PageHeading";
import { PhotosChart } from "@/components/organizer/PhotosChart";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import styles from "@/components/organizer.module.css";

/** Photo and participant numbers for one event, photos per hour, and how much of the photo limit is used (only admins can change the limit). */
export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { getEvent } = useOrganizerStore();
  const event = getEvent(id);

  if (!event) {
    return (
      <>
        <PageHeading title="Analytics" backHref="/events" backLabel="Events" />
        <p className={styles.empty}>Event not found.</p>
      </>
    );
  }

  const total = event.photos.length;
  const perParticipant = event.participants ? (total / event.participants).toFixed(1) : "0";
  const percent = Math.min(100, Math.round((total / event.capacity) * 100));

  return (
    <>
      <PageHeading
        title="Analytics"
        subtitle={`${event.name} · ${event.when}`}
        backHref="/events"
        backLabel="Events"
      />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Photos</span>
          <span className={styles.statValue}>{total}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Participants</span>
          <span className={styles.statValue}>{event.participants}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Photos per participant</span>
          <span className={styles.statValue}>{perParticipant}</span>
        </div>
      </div>

      <div className={styles.twoCol}>
        <section className={styles.panel} aria-labelledby="chart-title">
          <h2 id="chart-title" className={styles.panelTitle}>
            Photos per hour
          </h2>
          {event.hours.length ? (
            <PhotosChart hours={event.hours} />
          ) : (
            <p className={styles.muted}>Data will show once the event starts.</p>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="capacity-title">
          <h2 id="capacity-title" className={styles.panelTitle}>
            Photo limit
          </h2>
          <p className={styles.muted}>
            {total} of {event.capacity} photos used ({percent}%). Guests can&apos;t add photos once the limit is
            reached. Only an admin can change the limit.
          </p>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Photo limit used"
          >
            <div className={styles.progressFill} style={{ width: `${percent}%` }} />
          </div>
        </section>
      </div>
    </>
  );
}
