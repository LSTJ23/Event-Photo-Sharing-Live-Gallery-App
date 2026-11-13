"use client";

import Link from "next/link";
import { PageHeading } from "@/components/organizer/PageHeading";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import styles from "@/components/organizer.module.css";

/** Photos participants have reported, newest first; unread ones have a red dot. */
export default function ReportsPage() {
  const { reports, getEvent, markRead } = useOrganizerStore();

  return (
    <>
      <PageHeading title="Reported photos" />
      {reports.length === 0 ? (
        <p className={styles.empty}>No reports. Reported photos will appear here.</p>
      ) : (
        <ul className={styles.reportList}>
          {reports.map((report) => {
            const event = getEvent(report.eventId);
            const photo = event?.photos.find((p) => p.id === report.photoId);
            return (
              <li key={report.id}>
                <Link href={`/reports/${report.id}`} className={styles.reportRow} onClick={() => markRead(report.id)}>
                  <span
                    className={styles.reportThumb}
                    style={{ background: photo ? photo.shade : "var(--surface-muted)" }}
                    aria-hidden="true"
                  />
                  <span className={styles.reportText}>
                    <span className={styles.reportTitle}>A photo was reported</span>
                    <span className={styles.reportReason}>{report.reason}</span>
                    <span className={styles.reportMeta}>
                      {event?.name ?? "Unknown event"} · {report.time}
                    </span>
                  </span>
                  {report.state === "resolved" ? (
                    <span className={styles.resolvedPill}>Resolved</span>
                  ) : report.unread ? (
                    <span className={styles.unreadDot} aria-label="Unread" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
