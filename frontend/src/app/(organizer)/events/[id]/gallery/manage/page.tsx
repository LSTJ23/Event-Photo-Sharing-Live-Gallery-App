"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import { useState } from "react";
import { useEventSession } from "@/components/EventSession";
import { DownloadPhotosButton } from "@/components/DownloadPhotosButton";
import { CheckIcon, DownloadIcon, TrashIcon } from "@/components/icons";
import { PageHeading } from "@/components/organizer/PageHeading";
import { HiddenBadge, markerStyles } from "@/components/ReportMarkers";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import { RemovePhotosModal } from "@/components/RemovePhotosModal";
import { usePhotos } from "@/components/usePhotos";
import styles from "@/components/admin.module.css";
import tags from "@/components/organizer.module.css";
import { removePhotos } from "@/lib/api";
import { downloadAllPhotos } from "@/lib/downloadPhotos";
import { formatEventDate } from "@/lib/format";

/**
 * 09 Gallery management (phone and desktop): the event's details, Download all
 * photos, and the photos to select. Selected photos can be downloaded (as one
 * zip) or deleted (09b asks first).
 */
export default function ManageGalleryPage() {
  const { event } = useEventSession();
  const photos = usePhotos(event.id, 5000, true);
  const { notify } = useOrganizerStore();
  const galleryHref = `/events/${event.id}/gallery`;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toRemove, setToRemove] = useState<string[] | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeFailed, setRemoveFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const list = photos.status === "ready" ? photos.photos : [];
  const count = photos.status === "ready" ? list.length : null;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const askToRemove = (ids: string[]) => {
    setRemoveFailed(false);
    setToRemove(ids);
  };

  const confirmRemove = async () => {
    if (!toRemove) return;
    setRemoving(true);
    setRemoveFailed(false);
    try {
      await removePhotos(event.id, toRemove);
      setSelected((current) => {
        const next = new Set(current);
        toRemove.forEach((id) => next.delete(id));
        return next;
      });
      setToRemove(null);
      photos.refresh();
    } catch {
      setRemoveFailed(true);
    } finally {
      setRemoving(false);
    }
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

  return (
    <>
      <div>
        <PageHeading
          title="Manage photos"
          subtitle={`${event.name} · ${formatEventDate(event.date, true)}`}
          backHref={galleryHref}
          backLabel="Event Gallery"
        />

        <div className={styles.manageLayout}>
          <section className={`${styles.manageInfo} ${styles.manageCard}`} aria-labelledby="gallery-info">
            <h2 id="gallery-info" className={styles.sectionLabel}>
              Gallery information
            </h2>
            <dl className={styles.infoList}>
              <div className={styles.infoRow}>
                <dt>Event</dt>
                <dd>{event.name}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>Date</dt>
                <dd>{formatEventDate(event.date)}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>Photos</dt>
                <dd>{count === null ? "…" : `${count} ${count === 1 ? "photo" : "photos"}`}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>Public link</dt>
                <dd>
                  {event.shareLinkActive ? <span className={tags.activeTag}>Active</span> : <span className={tags.offTag}>Off</span>}
                </dd>
              </div>
            </dl>

            {list.length > 0 && (
              <DownloadPhotosButton eventId={event.id} eventName={event.name} className={`${styles.btn} ${styles.manageDownload}`} onDone={notify} />
            )}
          </section>

          <section className={styles.manageCard} aria-labelledby="manage-photos">
            <div className={styles.manageHeader}>
              <h2 id="manage-photos" className={styles.manageTitle}>
                Photos{count !== null ? ` · ${count}` : ""}
              </h2>
            </div>

            <div className={styles.manageBar} role="status">
              <span>{selected.size > 0 ? `${selected.size} selected` : "Tap photos to select them"}</span>
              {selected.size > 0 && (
                <>
                  <button type="button" className={styles.textButton} onClick={() => setSelected(new Set())}>
                    Clear
                  </button>
                  <button type="button" className={styles.btn} onClick={downloadSelected} disabled={downloading}>
                    <DownloadIcon /> {downloading ? "Preparing…" : `Download ${selected.size}`}
                  </button>
                  <button type="button" className={styles.btnDanger} onClick={() => askToRemove([...selected])}>
                    <TrashIcon size={15} /> Delete {selected.size}
                  </button>
                </>
              )}
            </div>

            {photos.status === "loading" && <p className={styles.muted}>Loading photos…</p>}
            {photos.status === "error" && <p className={styles.muted}>We couldn&apos;t load the photos.</p>}
            {photos.status === "ready" && list.length === 0 && <p className={styles.muted}>No photos in this gallery.</p>}

            {list.length > 0 && (
              <ul className={styles.manageGrid}>
                {list.map((photo) => {
                  const isSelected = selected.has(photo.id);
                  return (
                    <li key={photo.id} className={`${styles.tile} ${isSelected ? styles.tileSelected : ""}`}>
                      <button
                        type="button"
                        className={styles.selectTile}
                        aria-pressed={isSelected}
                        aria-label={`Select photo shared by ${photo.sharedBy}`}
                        onClick={() => toggle(photo.id)}
                      >
                        <img src={photo.url} alt="" loading="lazy" className={photo.hidden ? markerStyles.dimmed : undefined} />
                      </button>
                      <HiddenBadge hidden={photo.hidden} label="Hidden" />
                      <span className={styles.selectBubble} aria-hidden="true">
                        <CheckIcon size={12} strokeWidth={3} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {toRemove && (
        <RemovePhotosModal
          count={toRemove.length}
          removing={removing}
          failed={removeFailed}
          onConfirm={confirmRemove}
          onClose={() => setToRemove(null)}
        />
      )}
    </>
  );
}
