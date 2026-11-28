"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEventSession } from "@/components/EventSession";
import { FlagIcon } from "@/components/icons";
import { ReportPhotoDialog } from "@/components/ReportPhotoDialog";
import { ScreenHeader } from "@/components/ScreenHeader";
import { usePhotos } from "@/components/usePhotos";
import styles from "@/components/flow.module.css";
import { formatPhotoTimestamp } from "@/lib/format";

export default function PhotoPage() {
  const router = useRouter();
  const { photoId } = useParams<{ photoId: string }>();
  const { event } = useEventSession();
  const photos = usePhotos(event.id, 0);
  const galleryHref = `/e/${event.id}/gallery`;
  const touchStartX = useRef<number | null>(null);
  const [reporting, setReporting] = useState(false);
  // Photos reported from this screen, so the button says "Reported".
  const [reported, setReported] = useState<Set<string>>(new Set());

  const list = useMemo(() => (photos.status === "ready" ? photos.photos : []), [photos]);
  const index = list.findIndex((photo) => photo.id === photoId);
  const photo = index >= 0 ? list[index] : null;

  const go = useCallback(
    (step: number) => {
      const next = list[index + step];
      if (next) router.replace(`/e/${event.id}/photos/${next.id}`);
    },
    [list, index, router, event.id]
  );

  // Arrow keys on desktop.
  useEffect(() => {
    const onKey = (key: KeyboardEvent) => {
      if (key.key === "ArrowLeft") go(-1);
      if (key.key === "ArrowRight") go(1);
      if (reporting) return;
      if (key.key === "Escape") router.push(galleryHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, router, galleryHref, reporting]);

  const close = (
    <Link href={galleryHref} className={styles.iconBtn} aria-label="Close">
      ×
    </Link>
  );

  return (
    <main className={styles.screen}>
      <ScreenHeader
        title={photo ? `${index + 1} / ${list.length}` : ""}
        backHref={galleryHref}
        right={close}
      />

      {photos.status === "loading" && <p className={`${styles.muted} ${styles.emptyState}`}>Loading photo…</p>}
      {photos.status === "error" && (
        <p className={`${styles.error} ${styles.emptyState}`}>We couldn&apos;t load this photo.</p>
      )}
      {photos.status === "ready" && !photo && (
        <p className={`${styles.muted} ${styles.emptyState}`}>This photo is no longer available.</p>
      )}

      {photo && (
        <>
          <div
            className={styles.photoStage}
            onTouchStart={(touch) => {
              touchStartX.current = touch.touches[0].clientX;
            }}
            onTouchEnd={(touch) => {
              if (touchStartX.current === null) return;
              const distance = touch.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(distance) > 50) go(distance < 0 ? 1 : -1);
            }}
          >
            <img src={photo.url} alt={`Photo shared by ${photo.sharedBy}`} draggable={false} />
          </div>
          <div className={`${styles.photoMeta} ${styles.photoMetaRow}`}>
            <div>
              <p>Shared by {photo.sharedBy}</p>
              <p>{formatPhotoTimestamp(photo.createdAt)}</p>
            </div>
            {reported.has(photo.id) ? (
              <span className={styles.reportedTag}>
                <FlagIcon size={15} /> Reported
              </span>
            ) : (
              <button type="button" className={styles.reportButton} onClick={() => setReporting(true)}>
                <FlagIcon size={15} /> Report
              </button>
            )}
          </div>
          {reporting && (
            <ReportPhotoDialog
              eventId={event.id}
              photoId={photo.id}
              onReported={() => setReported((s) => new Set(s).add(photo.id))}
              onClose={() => setReporting(false)}
            />
          )}
        </>
      )}
    </main>
  );
}
