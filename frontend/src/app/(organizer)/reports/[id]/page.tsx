"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeading } from "@/components/organizer/PageHeading";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import { RemovePhotosModal } from "@/components/RemovePhotosModal";
import styles from "@/components/organizer.module.css";

/** One report: the photo, why and by whom it was reported, and Delete photo / Keep photo. */
export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getReport, getEvent, deletePhoto, keepReport } = useOrganizerStore();
  const [confirming, setConfirming] = useState(false);
  const report = getReport(id);

  if (!report) {
    return (
      <>
        <PageHeading title="Report details" backHref="/reports" backLabel="Reported photos" />
        <p className={styles.empty}>Report not found.</p>
      </>
    );
  }

  const event = getEvent(report.eventId);
  const photo = event?.photos.find((p) => p.id === report.photoId);
  const open = report.state === "open";

  return (
    <>
      <PageHeading title="Report details" backHref="/reports" backLabel="Reported photos" />
      <div className={styles.detail}>
        <div
          className={styles.detailPhoto}
          style={{ background: photo ? photo.shade : "var(--surface-muted)" }}
          role="img"
          aria-label={photo ? "The reported photo" : "Photo removed"}
        >
          {!photo && "Photo removed"}
        </div>

        <div>
          <dl className={styles.infoList}>
            <div className={styles.infoRow}>
              <dt>Reason</dt>
              <dd>{report.reason}</dd>
            </div>
            <div className={styles.infoRow}>
              <dt>Reported by</dt>
              <dd>{report.reportedBy}</dd>
            </div>
            <div className={styles.infoRow}>
              <dt>Event</dt>
              <dd>{event?.name ?? "Unknown event"}</dd>
            </div>
            <div className={styles.infoRow}>
              <dt>When</dt>
              <dd>{report.time}</dd>
            </div>
            <div className={styles.infoRow}>
              <dt>Status</dt>
              <dd className={open ? styles.needsReview : undefined}>{open ? "Needs review" : "Resolved"}</dd>
            </div>
          </dl>

          {open && (
            <div className={styles.detailActions}>
              <button type="button" className={styles.btnDanger} onClick={() => setConfirming(true)}>
                Delete photo
              </button>
              <button
                type="button"
                className={styles.btn}
                onClick={() => {
                  keepReport(report.id);
                  router.push("/reports");
                }}
              >
                Keep photo
              </button>
            </div>
          )}
        </div>
      </div>

      {confirming && (
        <RemovePhotosModal
          count={1}
          removing={false}
          failed={false}
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            deletePhoto(report.eventId, report.photoId);
            setConfirming(false);
            router.push("/reports");
          }}
        />
      )}
    </>
  );
}
