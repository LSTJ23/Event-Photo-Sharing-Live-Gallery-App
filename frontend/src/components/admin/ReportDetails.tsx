"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, EyeIcon, EyeOffIcon, TrashIcon } from "../icons";
import { ConfirmDialog } from "../ConfirmDialog";
import { RemovePhotosModal } from "../RemovePhotosModal";
import { HiddenBadge } from "../ReportMarkers";
import { Modal } from "../Modal";
import { useAdminStore } from "./AdminStore";
import { useHere, withFrom } from "./useBackTo";
import { useReportPhotos } from "../useReportPhotos";
import styles from "./dashboard.module.css";
import { formatWhen, type AdminReport } from "@/lib/adminData";
import { removePhotos, setPhotoHidden } from "@/lib/api";

const statusText = (r: AdminReport, orgName: string) =>
  r.state === "waiting"
    ? `Waiting for ${orgName}`
    : r.state === "removed" && r.removedByAdmin
      ? "Deleted by an admin"
      : r.state === "kept" && r.decidedByAdmin
        ? "Kept by an admin"
        : `${r.state === "kept" ? "Kept" : "Removed"} by ${orgName}`;

/**
 * Popup: the reported photo (big, on the left), what the organizer decided,
 * who reported it and why, and its event and organizer. Given several photos, it shows "‹ 1 of 3 ›"
 * arrows to go through them.
 */
export function ReportDetails({
  reports,
  onClose,
  showGalleryLink = true
}: {
  reports: AdminReport[];
  onClose: () => void;
  /** Hide "Open gallery" when the popup is opened from the gallery itself. */
  showGalleryLink?: boolean;
}) {
  const { getEvent, getOrganizer, notify, photoRemoved, keepReport, reports: latest } = useAdminStore();
  const here = useHere();
  const [index, setIndex] = useState(0);
  const given = reports[Math.min(index, reports.length - 1)];
  // Use the latest copy, so a delete or decision shows up right away.
  const report = latest.find((r) => r.id === given.id) ?? given;
  const event = getEvent(report.eventId);
  const org = event ? getOrganizer(event.organizerId) : undefined;
  const orgName = org?.org ?? "the organizer";
  const { photos, refresh } = useReportPhotos(reports);
  const [hiding, setHiding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmKeep, setConfirmKeep] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  const photo = report.photoId ? photos[report.photoId] : undefined;
  const photoUrl = photo?.url;

  // Admins can delete a reported photo outright.
  const deletePhoto = async () => {
    if (!report.photoId) return;
    setHiding(true);
    setDeleteFailed(false);
    try {
      await removePhotos(report.eventId, [report.photoId]);
      setConfirmDelete(false);
      photoRemoved(report.eventId, report.photoId);
      refresh();
    } catch {
      setDeleteFailed(true);
    } finally {
      setHiding(false);
    }
  };

  // Admins can hide a reported photo from guests while the organizer decides.
  const toggleHidden = async () => {
    if (!photo) return;
    setHiding(true);
    try {
      await setPhotoHidden(report.eventId, photo.id, !photo.hidden);
      refresh();
      notify(photo.hidden ? "Photo visible to guests again" : "Photo hidden from guests");
    } catch {
      notify("Couldn't change that. Try again.");
    } finally {
      setHiding(false);
    }
  };
  // Reasons with how many people gave each, most common first.
  const reasons = Object.entries(
    report.entries.reduce<Record<string, number>>((all, e) => ({ ...all, [e.reason]: (all[e.reason] ?? 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);
  const waiting = report.state === "waiting";

  // Asking before deleting: shown instead of the details, which come back after.
  if (confirmKeep) {
    return (
      <ConfirmDialog
        title="Keep this photo?"
        text="The report is closed. If the photo is hidden, it stays hidden until you show it again."
        confirmLabel="Keep photo"
        icon={<CheckIcon size={20} />}
        onClose={() => setConfirmKeep(false)}
        onConfirm={() => {
          setConfirmKeep(false);
          keepReport(report.id);
        }}
      />
    );
  }

  if (confirmDelete) {
    return <RemovePhotosModal count={1} removing={hiding} failed={deleteFailed} onConfirm={deletePhoto} onClose={() => setConfirmDelete(false)} />;
  }

  return (
    <Modal labelledBy="report-title" onClose={onClose} className={styles.reportDialog}>
      <div className={styles.reportPhoto}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo URLs can be blob: or any storage host
          <img src={photoUrl} alt={`Reported photo shared by ${report.sharedBy}`} />
        ) : (
          <span
            className={styles.reportPhotoBlank}
            style={report.state === "removed" ? undefined : { background: report.shade }}
            role="img"
            aria-label={report.state === "removed" ? "Photo deleted" : "Reported photo"}
          >
            {report.state === "removed" && "Photo deleted"}
          </span>
        )}
        <HiddenBadge hidden={photo?.hidden} label="Hidden from guests" />
      </div>

      <div className={styles.reportBody}>
        <div className={styles.detailHead}>
          <h2 id="report-title">Reported photo</h2>
          {reports.length > 1 && (
            <span className={styles.pager}>
              <button type="button" onClick={() => setIndex((i) => i - 1)} disabled={index === 0} aria-label="Previous photo">
                <ChevronLeftIcon />
              </button>
              <span aria-live="polite">
                {index + 1} of {reports.length}
              </span>
              <button type="button" onClick={() => setIndex((i) => i + 1)} disabled={index === reports.length - 1} aria-label="Next photo">
                <ChevronRightIcon />
              </button>
            </span>
          )}
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close" data-autofocus>
            <CloseIcon />
          </button>
        </div>

        {/* No status box while it just needs a decision; shown once hidden, kept or deleted. */}
        {(!waiting || photo?.hidden) && (
          <div className={`${styles.reportStatus} ${waiting && photo?.hidden ? "" : waiting ? styles.reportStatusWaiting : report.state === "kept" ? styles.reportStatusKept : styles.reportStatusRemoved}`}>
            <b>{waiting && photo?.hidden ? "Hidden" : statusText(report, orgName)}</b>
            {waiting && photo?.hidden ? <span>Guests can&apos;t see it.</span> : !waiting && report.decidedAt ? <span>{report.decidedAt}</span> : null}
          </div>
        )}

        <div>
          <h3 className={styles.subhead}>
            Reported by {report.count} {report.count === 1 ? "person" : "people"}
          </h3>
          <div className={styles.reasonChips}>
            {reasons.map(([reason, n]) => (
              <span key={reason} className={`${styles.reasonChip} ${photo?.hidden ? styles.reasonChipHidden : ""}`}>
                {reason}
                {n > 1 && <b>×{n}</b>}
              </span>
            ))}
          </div>
          <ul className={styles.entries}>
            {report.entries.map((e, i) => (
              <li key={i}>
                <span>{e.by}</span>
                <span className={styles.muted}>{e.reason}</span>
                <span className={styles.muted}>{e.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <dl className={styles.details}>
          <dt>Event</dt>
          <dd>
            {event ? (
              <>
                {event.name}
                <div className={styles.itemMeta}>{formatWhen(event.date, event.time, event.endDate, event.endTime)}</div>
              </>
            ) : (
              "Deleted event"
            )}
          </dd>
          <dt>Organizer</dt>
          <dd>
            {org ? (
              <>
                {org.org} · {org.person}
                <div className={styles.itemMeta}>{org.email}</div>
              </>
            ) : (
              "Unknown"
            )}
          </dd>
          <dt>Shared by</dt>
          <dd>{report.sharedBy}</dd>
        </dl>

        {(photo || (event && showGalleryLink)) && (
          <div className={styles.detailActions}>
            {event && showGalleryLink && (
              <Link href={withFrom(`/admin/events/${event.id}/gallery`, here)} className={`${styles.btn} ${styles.galleryLink}`}>
                Open gallery
              </Link>
            )}
            {photo && (
              <button type="button" className={styles.btn} onClick={toggleHidden} disabled={hiding}>
                {photo.hidden ? <EyeIcon /> : <EyeOffIcon />} {photo.hidden ? "Show" : "Hide"}
              </button>
            )}
            {photo && waiting && (
              <button type="button" className={`${styles.btn} ${styles.keepSoft}`} onClick={() => setConfirmKeep(true)} disabled={hiding}>
                <CheckIcon size={15} /> Keep
              </button>
            )}
            {photo && report.state !== "removed" && (
              <button
                type="button"
                className={`${styles.btn} ${styles.deleteSoft}`}
                onClick={() => {
                  setDeleteFailed(false);
                  setConfirmDelete(true);
                }}
                disabled={hiding}
              >
                <TrashIcon /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
