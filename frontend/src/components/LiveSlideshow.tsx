"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import { useEffect, useState } from "react";
import type { Photo } from "@/lib/types";
import styles from "./flow.module.css";

/**
 * Cycles through the newest photos every 4 seconds; new uploads join on the
 * next refresh. Pass `className` to size it (e.g. a big projector view).
 */
export function LiveSlideshow({ photos, className }: { photos: Photo[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const recent = photos.slice(0, 20);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => i + 1), 4000);
    return () => clearInterval(timer);
  }, []);

  const photo = recent[index % recent.length];

  return (
    <div className={`${styles.live} ${className ?? ""}`} aria-live="polite">
      <img key={photo.id} src={photo.url} alt={`Photo shared by ${photo.sharedBy}`} />
      <span className={styles.liveBadge}>LIVE</span>
      <div className={styles.liveCaption}>Shared by {photo.sharedBy}</div>
    </div>
  );
}
