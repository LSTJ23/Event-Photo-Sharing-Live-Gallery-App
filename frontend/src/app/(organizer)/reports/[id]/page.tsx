"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CheckIcon, EyeIcon, EyeOffIcon, FlagIcon, TrashIcon } from "@/components/icons";
import { PageHeading } from "@/components/organizer/PageHeading";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import { RemovePhotosModal } from "@/components/RemovePhotosModal";
import { HiddenBadge } from "@/components/ReportMarkers";
import { useReportPhotos } from "@/components/useReportPhotos";
import styles from "@/components/organizer.module.css";
import { removePhotos, setPhotoHidden } from "@/lib/api";

/**
 * One reported photo: the photo, who reported it and why, and what to do with
 * it: Keep it (closes the report), Hide it from guests while deciding (or show
 * it again), or Delete it from the gallery. You stay on the page afterwards.
 */
export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { getReport, getEvent, keepReport, photoDeleted, notify } = useOrganizerStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingKeep, setConfirmingKeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const report = getReport(id);
  // Opened from a photo in the gallery: Back returns to that photo, otherwise to Reported photos.
  const from = useSearchParams().get("from");
  const backHref = from && from.startsWith("/") && !from.startsWith("//") ? from : "/reports";
  const backLabel = backHref === "/reports" ? "Reported photos" : "the photo";
  const { photos, refresh } = useReportPhotos(report ? [{ eventId: report.eventId, photoId: report.galleryPhotoId }] : []);

  if (!report) {
    return (
      <>
        <PageHeading title="Report details" backHref={backHref} backLabel={backLabel} />
        <p className={styles.empty}>Report not found.</p>
      </>
    );
  }

  const event = getEvent(report.eventId);
  const photo = photos[report.galleryPhotoId];
  const open = report.state === "open";
  const deleted = report.state === "deleted";
  const people = report.entries.length;
  const reasons = Object.entries(
    report.entries.reduce<Record<string, number>>((all, e) => ({ ...all, [e.reason]: (all[e.reason] ?? 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  const toggleHidden = async () => {
    if (!photo) return;
    setBusy(true);
    try {
      await setPhotoHidden(report.eventId, photo.id, !photo.hidden);
      refresh();
      notify(photo.hidden ? "Photo visible to guests again" : "Photo hidden from guests");
    } catch {
      notify("Couldn't change that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const deletePhoto = async () => {
    setBusy(true);
    setDeleteFailed(false);
    try {
      await removePhotos(report.eventId, [report.galleryPhotoId]);
      setConfirmingDelete(false);
      photoDeleted(report.eventId, report.galleryPhotoId);
    } catch {
      setDeleteFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Report details"
        subtitle={`${event?.name ?? "Unknown event"} · first reported ${report.time}`}
        backHref={backHref}
        backLabel={backLabel}
      />
      <div className={styles.reportDetail}>
        <div className={styles.reportDetailPhoto}>
          {deleted ? (
            <span className={styles.reportDetailGone}>Photo deleted</span>
          ) : photo ? (
            <img src={photo.url} alt={`Reported photo shared by ${report.sharedBy}`} className={photo.hidden ? styles.dim : undefined} />
          ) : (
            <span className={styles.reportDetailGone} style={{ background: report.shade }} />
          )}
          <HiddenBadge hidden={!deleted && photo?.hidden} label="Hidden from guests" />
        </div>

        <div className={styles.reportDetailBody}>
          <div className={styles.reportDetailStatus}>
            {open && photo?.hidden ? (
              <span className={`${styles.statusTag} ${styles.statusHidden}`}>
                <EyeOffIcon size={13} /> Hidden
              </span>
            ) : open ? (
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
          </div>

          <section>
            <h2 className={styles.reportDetailLabel}>
              Reported by {people} {people === 1 ? "person" : "people"}
            </h2>
            <div className={styles.reasonChips}>
              {reasons.map(([reason, n]) => (
                <span key={reason} className={`${styles.reasonChip} ${photo?.hidden ? styles.reasonChipHidden : ""}`}>
                  {reason}
                  {n > 1 && <b>×{n}</b>}
                </span>
              ))}
            </div>
            <ul className={styles.reportEntries}>
              {report.entries.map((e, i) => (
                <li key={i}>
                  <span>{e.by}</span>
                  <span className={styles.muted}>{e.reason}</span>
                  <span className={styles.muted}>{e.time}</span>
                </li>
              ))}
            </ul>
          </section>

          <dl className={styles.infoList}>
            <div className={styles.infoRow}>
              <dt>Event</dt>
              <dd>{event?.name ?? "Unknown event"}</dd>
            </div>
            <div className={styles.infoRow}>
              <dt>Shared by</dt>
              <dd>{report.sharedBy}</dd>
            </div>
          </dl>

          {!deleted && (
            <div className={styles.reportDetailActions}>
              {photo && (
                <button type="button" className={styles.btn} onClick={toggleHidden} disabled={busy}>
                  {photo.hidden ? <EyeIcon /> : <EyeOffIcon />} {photo.hidden ? "Show" : "Hide"}
                </button>
              )}
              {open && (
                <button type="button" className={`${styles.btn} ${styles.keepButton}`} onClick={() => setConfirmingKeep(true)} disabled={busy}>
                  <CheckIcon size={15} /> Keep
                </button>
              )}
              <button
                type="button"
                className={`${styles.btn} ${styles.deleteButton}`}
                onClick={() => {
                  setDeleteFailed(false);
                  setConfirmingDelete(true);
                }}
                disabled={busy}
              >
                <TrashIcon size={15} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmingKeep && (
        <ConfirmDialog
          title="Keep this photo?"
          text="The report is closed. If the photo is hidden, it stays hidden until you show it again."
          confirmLabel="Keep photo"
          icon={<CheckIcon size={20} />}
          onClose={() => setConfirmingKeep(false)}
          onConfirm={() => {
            setConfirmingKeep(false);
            keepReport(report.id);
          }}
        />
      )}
      {confirmingDelete && (
        <RemovePhotosModal
          count={1}
          removing={busy}
          failed={deleteFailed}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={deletePhoto}
        />
      )}
    </>
  );
}
