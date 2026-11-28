"use client";

import Link from "next/link";
import { HiddenBadge, ReportFlag } from "@/components/ReportMarkers";
import { useReportPhotos } from "@/components/useReportPhotos";
import { PageHeading } from "@/components/organizer/PageHeading";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import styles from "@/components/organizer.module.css";

/** Photos participants have reported (one row per photo, with how many people reported it); unread ones have a red dot. */
export default function ReportsPage() {
  const { reports, getEvent, markRead } = useOrganizerStore();
  const { photos } = useReportPhotos(reports.map((r) => ({ eventId: r.eventId, photoId: r.galleryPhotoId })));

  return (
    <>
      <PageHeading title="Reported photos" />
      {reports.length === 0 ? (
        <p className={styles.empty}>No reports. Reported photos will appear here.</p>
      ) : (
        <ul className={styles.reportList}>
          {reports.map((report) => {
            const event = getEvent(report.eventId);
            const photo = report.state === "deleted" ? undefined : photos[report.galleryPhotoId];
            const people = report.entries.length;
            return (
              <li key={report.id}>
                <Link href={`/reports/${report.id}`} className={styles.reportRow} onClick={() => markRead(report.id)}>
                  <span className={styles.reportThumb} style={photo ? undefined : { background: "var(--surface-muted)" }} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- photo URLs can be blob: or any storage host */}
                    {photo && <img src={photo.url} alt="" loading="lazy" />}
                    {report.state === "open" && <ReportFlag count={people} />}
                    <HiddenBadge hidden={photo?.hidden} label="Hidden" />
                  </span>
                  <span className={styles.reportText}>
                    <span className={styles.reportTitle}>
                      Reported by {people} {people === 1 ? "person" : "people"}
                    </span>
                    <span className={styles.reportReason}>{report.reason}</span>
                    <span className={styles.reportMeta}>
                      {event?.name ?? "Unknown event"} · {report.time}
                    </span>
                  </span>
                  {report.state === "open" && photo?.hidden ? (
                    <span className={styles.hiddenPill}>Hidden</span>
                  ) : report.state === "kept" ? (
                    <span className={styles.keptPill}>Kept</span>
                  ) : report.state === "deleted" ? (
                    <span className={styles.deletedPill}>Deleted</span>
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
