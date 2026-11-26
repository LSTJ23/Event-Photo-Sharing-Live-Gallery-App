"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import { QrCode } from "../QrCode";
import styles from "../display.module.css";
import type { DisplayView } from "@/lib/displaySync";
import { displayLink } from "@/lib/shareLink";
import type { Photo } from "@/lib/types";

/**
 * What the audience sees: the current photo (slideshow) or every photo (grid),
 * and the QR code so guests can join. The audience screen shows it full size;
 * the presenter view shows it small as a preview.
 */
export function Stage({
  view,
  photo,
  photos,
  showQr,
  link,
  intervalMs,
  slideKey,
  playing,
  loading,
  compact = false
}: {
  view: DisplayView;
  photo: Photo | null;
  photos: Photo[];
  showQr: boolean;
  link: string;
  intervalMs: number;
  slideKey: number;
  playing: boolean;
  loading?: boolean;
  /** Smaller text and QR, for the presenter's preview. */
  compact?: boolean;
}) {
  return (
    <div className={`${styles.stage} ${compact ? styles.stageCompact : ""}`}>
      <section className={styles.photos} aria-live={compact ? "off" : "polite"} aria-label={view === "slideshow" ? "Slideshow" : "All photos"}>
        {!loading && photos.length === 0 && (
          <p className={styles.waiting}>
            Waiting for the first photo…
            <span>Scan the code to share yours.</span>
          </p>
        )}

        {view === "slideshow" && photo && (
          <div className={styles.slide}>
            <img key={photo.id} src={photo.url} alt={`Photo shared by ${photo.sharedBy}`} />
            <div className={styles.caption}>Shared by {photo.sharedBy}</div>
            {playing && photos.length > 1 && (
              <div className={styles.progress} aria-hidden="true">
                <span key={slideKey} style={{ animationDuration: `${intervalMs}ms` }} />
              </div>
            )}
          </div>
        )}

        {view === "grid" && photos.length > 0 && (
          <ul className={styles.grid}>
            {photos.map((p) => (
              <li key={p.id}>
                <img src={p.url} alt={`Photo shared by ${p.sharedBy}`} loading="lazy" />
                <span>{p.sharedBy}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showQr && (
        <aside className={styles.share} aria-label="Join and share your photos">
          <div className={styles.qr}>{link && <QrCode value={link} size={168} className={styles.qrImage} />}</div>
          <div className={styles.shareText}>
            <b>Share your photos</b>
            <span>Scan with your phone camera</span>
            {link && <span className={styles.shareLink}>{displayLink(link)}</span>}
          </div>
        </aside>
      )}
    </div>
  );
}
