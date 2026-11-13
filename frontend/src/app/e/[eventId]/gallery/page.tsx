"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useEventSession } from "@/components/EventSession";
import { LiveSlideshow } from "@/components/LiveSlideshow";
import { ScreenHeader } from "@/components/ScreenHeader";
import { usePhotos } from "@/components/usePhotos";
import styles from "@/components/flow.module.css";
import { formatEventDate } from "@/lib/format";
import type { Photo } from "@/lib/types";

type Tab = "all" | "live";

export default function GalleryPage() {
  const { event } = useEventSession();
  const photos = usePhotos(event.id);
  // /e/<id>/gallery?view=live opens straight on the Live Gallery tab.
  const startOnLive = useSearchParams().get("view") === "live";
  const [tab, setTab] = useState<Tab>(startOnLive ? "live" : "all");

  return (
    <main className={styles.screen}>
      <ScreenHeader title="Event Gallery" />

      <div className={styles.eventMeta}>
        <p className={styles.eventName}>{event.name}</p>
        <p className={styles.eventDate}>{formatEventDate(event.date)}</p>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Gallery view">
        {(
          [
            ["all", "All Photos"],
            ["live", "Live Gallery"]
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`${styles.tab} ${tab === id ? styles.tabActive : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {photos.status === "loading" && <p className={`${styles.muted} ${styles.emptyState}`}>Loading photos…</p>}
      {photos.status === "error" && (
        <p className={`${styles.error} ${styles.emptyState}`}>We couldn&apos;t load the gallery. Try again shortly.</p>
      )}
      {photos.status === "ready" && photos.photos.length === 0 && (
        <p className={`${styles.muted} ${styles.emptyState}`}>No photos yet. Be the first to share one!</p>
      )}
      {photos.status === "ready" && photos.photos.length > 0 && (
        <div role="tabpanel">
          {tab === "all" ? (
            <PhotoGrid eventId={event.id} photos={photos.photos} />
          ) : (
            <LiveSlideshow photos={photos.photos} />
          )}
        </div>
      )}

      <div className={`${styles.footer} ${styles.stickyFooter}`}>
        <Link href={`/e/${event.id}/camera`} className={styles.btnPrimary}>
          + Add Photo
        </Link>
      </div>
    </main>
  );
}

function PhotoGrid({ eventId, photos }: { eventId: string; photos: Photo[] }) {
  return (
    <ul className={styles.grid}>
      {photos.map((photo) => (
        <li key={photo.id} className={styles.gridItem}>
          <Link href={`/e/${eventId}/photos/${photo.id}`} aria-label={`Photo shared by ${photo.sharedBy}`}>
            <img src={photo.url} alt="" loading="lazy" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
