"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import Link from "next/link";
import { useState } from "react";
import { useEventSession } from "@/components/EventSession";
import { CalendarIcon, ChevronLeftIcon, LinkIcon, PresentIcon, SettingsIcon } from "@/components/icons";
import { PhotoViewer } from "@/components/PhotoViewer";
import { ShareLinkModal } from "@/components/ShareLinkModal";
import { useOrigin } from "@/components/useOrigin";
import { usePhotos } from "@/components/usePhotos";
import styles from "@/components/admin.module.css";
import { formatEventDate } from "@/lib/format";
import { shareLinkFor } from "@/lib/shareLink";

/**
 * 06 Event gallery for the organizer (phone and desktop): all photos, with
 * Display gallery (present mode for a big screen: slideshow or grid),
 * Manage photos (select and remove) and the share link. Click a photo to
 * see it big with its details (PhotoViewer).
 */
export default function OrganizerGalleryPage() {
  const { event } = useEventSession();
  const photos = usePhotos(event.id);
  const origin = useOrigin();
  const [sharing, setSharing] = useState(false);
  // Which photo is open in the popup (by id, so new photos arriving don't shift it).
  const [openId, setOpenId] = useState<string | null>(null);
  const list = photos.status === "ready" ? photos.photos : [];
  const openIndex = openId ? list.findIndex((p) => p.id === openId) : -1;
  const count = photos.status === "ready" ? photos.photos.length : null;
  const link = shareLinkFor(origin, event.id);
  const galleryHref = `/events/${event.id}/gallery`;

  return (
    <>
      <Link href="/events" className={styles.backLink}>
        <ChevronLeftIcon /> Events
      </Link>
      <section className={styles.eventHeader}>
        <div className={styles.eventTitleRow}>
          <CalendarIcon />
          <div>
            <h1 className={styles.eventName}>{event.name}</h1>
            <p className={styles.eventMeta}>
              {formatEventDate(event.date)}
              {event.location ? ` · ${event.location}` : ""}
              {count !== null && ` · ${count} ${count === 1 ? "photo" : "photos"}`}
            </p>
          </div>
        </div>
      </section>

      <div className={styles.galleryActions}>
        <Link href={`/display/${event.id}?back=${encodeURIComponent(galleryHref)}`} className={`${styles.btnDark} ${styles.displayButton}`}>
          <PresentIcon /> Display gallery
        </Link>
        <Link href={`/events/${event.id}/gallery/manage`} className={styles.btn}>
          <SettingsIcon /> Manage photos
        </Link>
        <button type="button" className={styles.btn} onClick={() => setSharing(true)} disabled={!origin}>
          <LinkIcon /> Share link
        </button>
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
              <button type="button" className={styles.tileButton} onClick={() => setOpenId(photo.id)} aria-label={`Open photo shared by ${photo.sharedBy}`}>
                <img src={photo.url} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {openIndex >= 0 && (
        <PhotoViewer
          photos={list}
          index={openIndex}
          eventName={event.name}
          onIndex={(i) => setOpenId(list[i]?.id ?? null)}
          onClose={() => setOpenId(null)}
        />
      )}
      {sharing && <ShareLinkModal link={link} eventId={event.id} onClose={() => setSharing(false)} />}
    </>
  );
}
