"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import { useBackTo, useHere } from "@/components/admin/useBackTo";
import { useAdminStore } from "@/components/admin/AdminStore";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DownloadPhotosButton } from "@/components/DownloadPhotosButton";
import { CheckIcon, DownloadIcon, EyeIcon, EyeOffIcon, LinkIcon, PresentIcon, TrashIcon } from "@/components/icons";
import { ReportDetails } from "@/components/admin/ReportDetails";
import { HiddenBadge, HiddenNote, markerStyles, ReportFlag, ReportNote } from "@/components/ReportMarkers";
import { PhotoViewer } from "@/components/PhotoViewer";
import { RemovePhotosModal } from "@/components/RemovePhotosModal";
import { ShareLinkModal } from "@/components/ShareLinkModal";
import { useOrigin } from "@/components/useOrigin";
import { usePhotos } from "@/components/usePhotos";
import viewerStyles from "@/components/admin.module.css";
import styles from "@/components/admin/dashboard.module.css";
import { formatWhen, openReportCount, reportsForPhoto, type AdminReport } from "@/lib/adminData";
import { removePhotos, setPhotoHidden } from "@/lib/api";
import { downloadAllPhotos } from "@/lib/downloadPhotos";
import { shareLinkFor } from "@/lib/shareLink";

/**
 * An event's photos, seen from the admin dashboard. Admins can open the
 * Display gallery (present mode), share the link and QR code, and download
 * every photo as a zip. Clicking a
 * photo opens it big with Download and Delete. "Select" picks several photos to
 * download (as one zip) or delete at once.
 * Back goes to where you came from (?from=), otherwise Manage Events.
 */
export default function AdminGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const { getEvent, getOrganizer, notify, reports, keepReport } = useAdminStore();
  const origin = useOrigin();
  const photos = usePhotos(id, 5000, true);
  const [sharing, setSharing] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [failed, setFailed] = useState(false);
  // The photo open in the popup, and whether we're confirming deleting just that one.
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingOne, setDeletingOne] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  // Reports opened from the photo popup's "Review".
  const [reviewing, setReviewing] = useState<AdminReport[] | null>(null);
  const [hiding, setHiding] = useState(false);
  const [confirmKeep, setConfirmKeep] = useState<number[] | null>(null);
  const event = getEvent(id);
  const back = useBackTo("/admin/events");
  const here = useHere();

  if (!event) return <PageHeader title="Event not found" back={back} subtitle="It may have been deleted, or the link is wrong." />;

  const org = getOrganizer(event.organizerId);
  const list = photos.status === "ready" ? photos.photos : [];
  const openIndex = openId ? list.findIndex((p) => p.id === openId) : -1;
  // What the delete confirmation is about: one photo from the popup, or the selection.
  const toDelete = deletingOne ? [deletingOne] : [...selected];

  const toggle = (photoId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });

  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  // Download the selected photos as one zip file.
  const downloadSelected = async () => {
    setDownloading(true);
    try {
      const n = await downloadAllPhotos(event.name, list.filter((p) => selected.has(p.id)));
      notify(`Downloaded ${n} ${n === 1 ? "photo" : "photos"}`);
    } catch {
      notify("Couldn't download the photos. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Hide a photo from guests (participant gallery, Display gallery), or show it again.
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

  const remove = async () => {
    setRemoving(true);
    setFailed(false);
    try {
      // TODO (backend): the server must allow admins to delete any event's photos.
      await removePhotos(event.id, toDelete);
      const n = toDelete.length;
      photos.refresh();
      setConfirming(false);
      if (deletingOne) {
        // Move the popup to the next photo, or close it if that was the last one.
        const i = list.findIndex((p) => p.id === deletingOne);
        const next = list[i + 1] ?? list[i - 1];
        setOpenId(next ? next.id : null);
        setDeletingOne(null);
      } else {
        stopSelecting();
      }
      notify(`Deleted ${n} ${n === 1 ? "photo" : "photos"}`);
    } catch {
      setFailed(true);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={event.name}
        back={back}
        subtitle={`${formatWhen(event.date, event.time, event.endDate, event.endTime)} · ${event.venue}${org ? ` · ${org.org}` : ""}`}
      />

      <div className={styles.galleryActions}>
        <Link href={`/display/${event.id}?back=${encodeURIComponent(here)}`} className={`${styles.btnDark} ${styles.displayButton}`}>
          <PresentIcon /> Display gallery
        </Link>
        <button type="button" className={styles.btn} onClick={() => setSharing(true)} disabled={!origin}>
          <LinkIcon /> Share link &amp; QR
        </button>
        {list.length > 0 && (
          <DownloadPhotosButton eventId={event.id} eventName={event.name} label="Download all photos" className={styles.btn} onDone={notify} />
        )}
      </div>

      <section className={styles.card} aria-labelledby="photos-title">
        <div className={styles.cardHead}>
          <h2 id="photos-title" className={styles.cardTitle}>
            Photos{photos.status === "ready" ? ` · ${list.length}` : ""}
          </h2>
          {list.length > 0 &&
            (selecting ? (
              <button type="button" className={`${styles.btn} ${styles.small}`} onClick={stopSelecting}>
                Done
              </button>
            ) : (
              <button type="button" className={`${styles.btn} ${styles.small}`} onClick={() => setSelecting(true)}>
                <CheckIcon size={14} /> Select
              </button>
            ))}
        </div>

        {selecting && (
          <div className={styles.selectBar} role="status">
            <span>{selected.size === 0 ? "Tap photos to select them" : `${selected.size} selected`}</span>
            <button type="button" className={`${styles.btn} ${styles.small}`} disabled={selected.size === 0 || downloading} onClick={downloadSelected}>
              <DownloadIcon /> {downloading ? "Preparing…" : `Download${selected.size ? ` ${selected.size}` : ""}`}
            </button>
            <button
              type="button"
              className={`${styles.btnDanger} ${styles.small}`}
              disabled={selected.size === 0}
              onClick={() => {
                setDeletingOne(null);
                setFailed(false);
                setConfirming(true);
              }}
            >
              <TrashIcon /> Delete{selected.size ? ` ${selected.size}` : ""}
            </button>
          </div>
        )}

        {photos.status === "loading" && <p className={styles.muted}>Loading photos…</p>}
        {photos.status === "error" && <p className={styles.muted}>Couldn&apos;t load the photos. Try again in a moment.</p>}
        {photos.status === "ready" &&
          (list.length === 0 ? (
            <p className={styles.muted}>No photos have been shared yet.</p>
          ) : (
            <div className={styles.photoGrid}>
              {list.map((p) => {
                const isSelected = selected.has(p.id);
                const flagged = openReportCount(reports, p.id);
                const photo = (
                  <>
                    <ReportFlag count={flagged} />
                    <span className={styles.photoFrame}>
                      <img
                        src={p.url}
                        alt={`Photo shared by ${p.sharedBy}${flagged ? `, reported ${flagged} times` : ""}${p.hidden ? ", hidden from guests" : ""}`}
                        loading="lazy"
                        className={p.hidden ? markerStyles.dimmed : undefined}
                      />
                      <HiddenBadge hidden={p.hidden} />
                    </span>
                    <span className={styles.photoCaption}>Shared by {p.sharedBy}</span>
                  </>
                );
                return selecting ? (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.photo} ${styles.photoSelectable} ${isSelected ? styles.photoSelected : ""}`}
                    aria-pressed={isSelected}
                    aria-label={`Photo shared by ${p.sharedBy}`}
                    onClick={() => toggle(p.id)}
                  >
                    <span className={styles.photoCheck} aria-hidden="true">
                      {isSelected && <CheckIcon size={14} />}
                    </span>
                    {photo}
                  </button>
                ) : (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.photo} ${styles.photoOpen}`}
                    aria-label={`Open photo shared by ${p.sharedBy}`}
                    onClick={() => setOpenId(p.id)}
                  >
                    {photo}
                  </button>
                );
              })}
            </div>
          ))}
      </section>

      {openIndex >= 0 && !confirming && !reviewing && !confirmKeep && (
        <PhotoViewer
          photos={list}
          index={openIndex}
          eventName={event.name}
          onIndex={(i) => setOpenId(list[i]?.id ?? null)}
          onClose={() => setOpenId(null)}
          notice={(p) => {
            const about = reportsForPhoto(reports, p.id);
            return (
              <div className={markerStyles.notes}>
                <HiddenNote hidden={p.hidden} text="Hidden from guests" />
                <ReportNote
                  count={about.reduce((n, r) => n + r.count, 0)}
                  open={about.some((r) => r.state === "waiting")}
                  onReview={() => setReviewing(about)}
                />
              </div>
            );
          }}
          actions={(p) => {
            const waiting = reportsForPhoto(reports, p.id).filter((r) => r.state === "waiting");
            return (
              <>
                <button type="button" className={viewerStyles.btn} onClick={() => toggleHidden(p.id, !p.hidden)} disabled={hiding}>
                  {p.hidden ? <EyeIcon /> : <EyeOffIcon />} {p.hidden ? "Show" : "Hide"}
                </button>
                {waiting.length > 0 && (
                  <button type="button" className={`${viewerStyles.btn} ${viewerStyles.keepButton}`} onClick={() => setConfirmKeep(waiting.map((r) => r.id))}>
                    <CheckIcon size={15} /> Keep
                  </button>
                )}
              </>
            );
          }}
          onDelete={() => {
            setDeletingOne(list[openIndex].id);
            setFailed(false);
            setConfirming(true);
          }}
        />
      )}
      {confirmKeep && (
        <ConfirmDialog
          title="Keep this photo?"
          text="The report is closed. If the photo is hidden, it stays hidden until you show it again."
          confirmLabel="Keep photo"
          icon={<CheckIcon size={20} />}
          onClose={() => setConfirmKeep(null)}
          onConfirm={() => {
            confirmKeep.forEach((id) => keepReport(id));
            setConfirmKeep(null);
          }}
        />
      )}
      {reviewing && <ReportDetails
          reports={reviewing}
          showGalleryLink={false}
          onClose={() => {
            // Back to the gallery, not to the photo popup.
            setReviewing(null);
            setOpenId(null);
          }}
        />}
      {confirming && (
        <RemovePhotosModal count={toDelete.length} removing={removing} failed={failed} onConfirm={remove} onClose={() => {
            setConfirming(false);
            setDeletingOne(null);
          }} />
      )}
      {sharing && origin && <ShareLinkModal link={shareLinkFor(origin, event.id)} eventId={event.id} onClose={() => setSharing(false)} />}
    </>
  );
}

