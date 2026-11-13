"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import Link from "next/link";
import { useState } from "react";
import { AdminTopBar } from "@/components/AdminTopBar";
import { useEventSession } from "@/components/EventSession";
import { CalendarIcon, ChevronLeftIcon, LinkIcon, SettingsIcon } from "@/components/icons";
import { LiveSlideshow } from "@/components/LiveSlideshow";
import { ShareLinkModal } from "@/components/ShareLinkModal";
import { useOrigin } from "@/components/useOrigin";
import { usePhotos } from "@/components/usePhotos";
import styles from "@/components/admin.module.css";
import { formatEventDate } from "@/lib/format";
import { shareLinkFor } from "@/lib/shareLink";

type Tab = "all" | "live";

/** 06 Admin Gallery (desktop), with 07/08 the share-link dialog. */
export default function AdminGalleryPage() {
  const { event } = useEventSession();
  const photos = usePhotos(event.id);
  const origin = useOrigin();
  const [tab, setTab] = useState<Tab>("all");
  const [sharing, setSharing] = useState(false);
  const count = photos.status === "ready" ? photos.photos.length : null;
  const link = shareLinkFor(origin, event.id);

  return (
    <main className={styles.page}>
      <AdminTopBar
        actions={
          <>
            <Link
              href={`/admin/e/${event.id}/manage`}
              className={styles.iconButton}
              aria-label="Manage gallery"
              title="Manage gallery"
            >
              <SettingsIcon />
            </Link>
            <button
              type="button"
              className={styles.btnDark}
              onClick={() => setSharing(true)}
              disabled={!origin}
              aria-label="Copy Public Share Link"
            >
              <LinkIcon /> <span className={styles.btnLabel}>Copy Public Share Link</span>
            </button>
          </>
        }
      />

      <div className={styles.container}>
        <Link href="/events" className={styles.backLink}>
          <ChevronLeftIcon /> Events
        </Link>
        <section className={`${styles.eventHeader} ${styles.eventHeaderAfterBack}`}>
          <div className={styles.eventTitleRow}>
            <CalendarIcon />
            <div>
              <h1 className={styles.eventName}>{event.name}</h1>
              <p className={styles.eventMeta}>
                {formatEventDate(event.date)}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
          </div>
          {count !== null && (
            <p className={styles.photoCount}>
              {count} {count === 1 ? "photo" : "photos"}
            </p>
          )}
        </section>

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

        {photos.status === "loading" && <p className={styles.emptyGrid}>Loading photos…</p>}
        {photos.status === "error" && (
          <p className={styles.emptyGrid}>We couldn&apos;t load the gallery. Try again shortly.</p>
        )}
        {photos.status === "ready" && photos.photos.length === 0 && (
          <p className={styles.emptyGrid}>No photos yet. Share the event link so participants can start adding them.</p>
        )}
        {photos.status === "ready" && photos.photos.length > 0 && (
          <div role="tabpanel">
            {tab === "all" ? (
              <ul className={styles.grid}>
                {photos.photos.map((photo) => (
                  <li key={photo.id} className={styles.tile}>
                    <img src={photo.url} alt={`Photo shared by ${photo.sharedBy}`} loading="lazy" />
                  </li>
                ))}
              </ul>
            ) : (
              <LiveSlideshow photos={photos.photos} className={styles.liveView} />
            )}
          </div>
        )}
      </div>

      {sharing && <ShareLinkModal link={link} eventId={event.id} onClose={() => setSharing(false)} />}
    </main>
  );
}
