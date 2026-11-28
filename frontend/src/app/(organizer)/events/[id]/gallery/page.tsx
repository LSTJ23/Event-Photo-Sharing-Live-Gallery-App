"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useEventSession } from "@/components/EventSession";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CheckIcon, EyeIcon, EyeOffIcon, LinkIcon, PresentIcon, SettingsIcon } from "@/components/icons";
import { PageHeading } from "@/components/organizer/PageHeading";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import { HiddenBadge, HiddenNote, markerStyles, ReportFlag, ReportNote } from "@/components/ReportMarkers";
import { RemovePhotosModal } from "@/components/RemovePhotosModal";
import { PhotoViewer } from "@/components/PhotoViewer";
import { ShareLinkModal } from "@/components/ShareLinkModal";
import { useOrigin } from "@/components/useOrigin";
import { usePhotos } from "@/components/usePhotos";
import styles from "@/components/admin.module.css";
import { removePhotos, setPhotoHidden } from "@/lib/api";
import { formatEventDate } from "@/lib/format";
import { shareLinkFor } from "@/lib/shareLink";

/**
 * 06 Event gallery for the organizer (phone and desktop): all photos, with
 * Display gallery (present mode for a big screen: slideshow or grid), Share
 * event (link and QR code) and Manage photos. Click a photo to see it big with
 * its details, Download and Delete (PhotoViewer).
 */
export default function OrganizerGalleryPage() {
  const { event } = useEventSession();
  const photos = usePhotos(event.id, 5000, true);
  const origin = useOrigin();
  const { reports, keepReport, photoDeleted, notify } = useOrganizerStore();
  const [sharing, setSharing] = useState(false);
  // Reports about a photo in this event (each report is one person).
  const reportsFor = (photoId: string) => reports.filter((r) => r.eventId === event.id && r.galleryPhotoId === photoId);
  const openReports = (photoId: string) => reportsFor(photoId).filter((r) => r.state === "open");
  // How many people reported the photo and are still waiting on a decision.
  const openCount = (photoId: string) => openReports(photoId).reduce((n, r) => n + r.entries.length, 0);
  const [hiding, setHiding] = useState(false);
  const [confirmKeep, setConfirmKeep] = useState<number | null>(null);
  // Which photo is open in the popup (by id, so new photos arriving don't shift it).
  // Coming back from a report (?photo=<id>) reopens that photo.
  const [openId, setOpenId] = useState<string | null>(useSearchParams().get("photo"));
  const list = photos.status === "ready" ? photos.photos : [];
  const openIndex = openId ? list.findIndex((p) => p.id === openId) : -1;
  // Deleting the photo open in the popup: asking, working, or it failed.
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  // Hide a photo from guests while you decide, or show it again.
  const toggleHidden = async (photoId: string, hidden: boolean) => {
    setHiding(true);
    try {
      await setPhotoHidden(event.id, photoId, hidden);
      photos.refresh();
      notify(hidden ? "Photo hidden from guests" : "Photo visible to guests again");
    } catch {
      notify("Couldn't change that. Try again.");
    } finally {
      setHiding(false);
    }
  };

  const deleteOpenPhoto = async () => {
    if (!openId) return;
    setDeleting(true);
    setDeleteFailed(false);
    try {
      await removePhotos(event.id, [openId]);
      if (reportsFor(openId).length) photoDeleted(event.id, openId);
      // Move to the next photo, or close the popup if that was the last one.
      const next = list[openIndex + 1] ?? list[openIndex - 1];
      setOpenId(next ? next.id : null);
      setConfirmDelete(false);
      photos.refresh();
    } catch {
      setDeleteFailed(true);
    } finally {
      setDeleting(false);
    }
  };
  const count = photos.status === "ready" ? photos.photos.length : null;
  const link = shareLinkFor(origin, event.id);
  const galleryHref = `/events/${event.id}/gallery`;

  return (
    <>
      <PageHeading
        title={event.name}
        subtitle={`${formatEventDate(event.date, true)}${event.location ? ` · ${event.location}` : ""}${count !== null ? ` · ${count} ${count === 1 ? "photo" : "photos"}` : ""}`}
        backHref="/events"
        backLabel="Events"
      />

      <div className={styles.galleryActions}>
        <Link href={`/display/${event.id}?back=${encodeURIComponent(galleryHref)}`} className={`${styles.btnDark} ${styles.displayButton}`}>
          <PresentIcon /> Display gallery
        </Link>
        <button type="button" className={styles.btn} onClick={() => setSharing(true)} disabled={!origin}>
          <LinkIcon /> Share event
        </button>
        <Link href={`/events/${event.id}/gallery/manage`} className={styles.btn}>
          <SettingsIcon /> Manage photos
        </Link>
      </div>

      {photos.status === "loading" && <p className={styles.emptyGrid}>Loading photos…</p>}
      {photos.status === "error" && (
        <p className={styles.emptyGrid}>We couldn&apos;t load the gallery. Try again shortly.</p>
      )}
      {photos.status === "ready" && photos.photos.length === 0 && (
        <p className={styles.emptyGrid}>No photos yet. Share the event link so participants can start adding them.</p>
      )}
      {photos.status === "ready" && photos.photos.length > 0 && (
        <ul className={styles.grid}>
          {photos.photos.map((photo) => (
            <li key={photo.id} className={styles.tile}>
              <button type="button" className={styles.tileButton} onClick={() => setOpenId(photo.id)} aria-label={`Open photo shared by ${photo.sharedBy}${openCount(photo.id) ? `, reported by ${openCount(photo.id)}` : ""}${photo.hidden ? ", hidden from guests" : ""}`}>
                <img src={photo.url} alt="" loading="lazy" className={photo.hidden ? markerStyles.dimmed : undefined} />
              </button>
              <ReportFlag count={openCount(photo.id)} />
              <HiddenBadge hidden={photo.hidden} label="Hidden" />
            </li>
          ))}
        </ul>
      )}

      {openIndex >= 0 && !confirmDelete && confirmKeep === null && (
        <PhotoViewer
          photos={list}
          index={openIndex}
          eventName={event.name}
          onIndex={(i) => setOpenId(list[i]?.id ?? null)}
          onClose={() => setOpenId(null)}
          notice={(p) => {
            const about = reportsFor(p.id);
            const open = about.filter((r) => r.state === "open");
            const people = (list: typeof about) => list.reduce((n, r) => n + r.entries.length, 0);
            return (
              <div className={markerStyles.notes}>
                <HiddenNote hidden={p.hidden} text="Hidden from guests" />
                <ReportNote count={people(open) || people(about)} open={open.length > 0} reviewHref={open[0] ? `/reports/${open[0].id}?from=${encodeURIComponent(`${galleryHref}?photo=${p.id}`)}` : undefined} />
              </div>
            );
          }}
          actions={(p) => {
            const open = openReports(p.id);
            return (
              <>
                <button type="button" className={styles.btn} onClick={() => toggleHidden(p.id, !p.hidden)} disabled={hiding}>
                  {p.hidden ? <EyeIcon /> : <EyeOffIcon />} {p.hidden ? "Show" : "Hide"}
                </button>
                {open.length > 0 && (
                  <button type="button" className={`${styles.btn} ${styles.keepButton}`} onClick={() => setConfirmKeep(open[0].id)}>
                    <CheckIcon size={15} /> Keep
                  </button>
                )}
              </>
            );
          }}
          onDelete={() => {
            setDeleteFailed(false);
            setConfirmDelete(true);
          }}
        />
      )}
      {confirmKeep !== null && (
        <ConfirmDialog
          title="Keep this photo?"
          text="The report is closed. If the photo is hidden, it stays hidden until you show it again."
          confirmLabel="Keep photo"
          icon={<CheckIcon size={20} />}
          onClose={() => setConfirmKeep(null)}
          onConfirm={() => {
            keepReport(confirmKeep);
            setConfirmKeep(null);
          }}
        />
      )}
      {confirmDelete && (
        <RemovePhotosModal count={1} removing={deleting} failed={deleteFailed} onConfirm={deleteOpenPhoto} onClose={() => setConfirmDelete(false)} />
      )}
      {sharing && <ShareLinkModal link={link} eventId={event.id} onClose={() => setSharing(false)} />}
    </>
  );
}
