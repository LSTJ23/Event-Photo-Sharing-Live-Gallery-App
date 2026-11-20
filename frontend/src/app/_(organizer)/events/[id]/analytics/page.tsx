"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeading } from "@/components/organizer/PageHeading";
import { PhotosChart } from "@/components/organizer/PhotosChart";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import styles from "@/components/organizer.module.css";

/** Photo and participant numbers for one event, photos per hour, and the photo limit. */
export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { getEvent, setCapacity, notify } = useOrganizerStore();
  const event = getEvent(id);
  const [limit, setLimit] = useState(event ? String(event.capacity) : "");

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

  const save = () => {
    const value = parseInt(limit, 10);
    if (!value || value < 1) return notify("Enter a limit of 1 or more");
    setCapacity(event.id, value);
  };

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
          <span className={styles.statValue}>{total}</span>
          <span className={styles.statLabel}>Photos</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{event.participants}</span>
          <span className={styles.statLabel}>Participants</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{perParticipant}</span>
          <span className={styles.statLabel}>Photos per participant</span>
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
            reached.
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
          <form
            className={styles.capacityForm}
            onSubmit={(submit) => {
              submit.preventDefault();
              save();
            }}
          >
            <input
              type="number"
              min={1}
              inputMode="numeric"
              className={styles.input}
              value={limit}
              onChange={(change) => setLimit(change.target.value)}
              aria-label="Photo limit"
            />
            <button type="submit" className={styles.btnDark}>
              Save limit
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
