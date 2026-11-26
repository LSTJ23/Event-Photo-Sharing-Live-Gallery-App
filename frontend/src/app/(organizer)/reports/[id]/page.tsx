"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CheckIcon, FlagIcon, TrashIcon } from "@/components/icons";
import { PageHeading } from "@/components/organizer/PageHeading";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import { RemovePhotosModal } from "@/components/RemovePhotosModal";
import styles from "@/components/organizer.module.css";

/** One report: the photo, why and by whom it was reported, and Delete photo / Keep photo. */
export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { getReport, getEvent, deletePhoto, keepReport } = useOrganizerStore();
  const [confirming, setConfirming] = useState(false);
  const [confirmingKeep, setConfirmingKeep] = useState(false);
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
  // After Keep or Delete you stay here and see the new status; "‹ Reported photos" goes back.
  const shade = photo?.shade ?? null;
  const open = report.state === "open";

  return (
    <>
      <PageHeading title="Report details" backHref="/reports" backLabel="Reported photos" />
      <div className={styles.detail}>
        <div
          className={styles.detailPhoto}
          style={{ background: shade ?? "var(--surface-muted)" }}
          role="img"
          aria-label={shade ? "The reported photo" : "Photo removed"}
        >
          {!shade && "Photo removed"}
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
              <dd>
                {open ? (
                  <span className={`${styles.statusTag} ${styles.statusOpen}`}>
                    <FlagIcon size={13} /> Needs review
                  </span>
                ) : report.state === "kept" ? (
                  <span className={`${styles.statusTag} ${styles.statusKept}`}>
                    <CheckIcon size={13} /> Kept
                  </span>
                ) : (
                  <span className={`${styles.statusTag} ${styles.statusDeleted}`}>
                    <TrashIcon size={13} /> Deleted
                  </span>
                )}
              </dd>
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
                onClick={() => setConfirmingKeep(true)}
              >
                Keep photo
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmingKeep && (
        <ConfirmDialog
          title="Keep this photo?"
          text="It stays in the gallery for everyone, and the report is closed."
          confirmLabel="Keep photo"
          icon={<CheckIcon size={20} />}
          onClose={() => setConfirmingKeep(false)}
          onConfirm={() => {
            setConfirmingKeep(false);
            keepReport(report.id);
          }}
        />
      )}
      {confirming && (
        <RemovePhotosModal
          count={1}
          removing={false}
          failed={false}
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            deletePhoto(report.eventId, report.photoId);
          }}
        />
      )}
    </>
  );
}
