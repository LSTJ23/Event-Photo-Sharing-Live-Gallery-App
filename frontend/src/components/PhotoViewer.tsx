"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, DownloadIcon } from "./icons";
import { Modal } from "./Modal";
import styles from "./admin.module.css";
import { downloadPhoto } from "@/lib/downloadPhotos";
import { formatPhotoTimestamp } from "@/lib/format";
import type { Photo } from "@/lib/types";

/**
 * Popup for one photo in the organizer's gallery: the photo big, who shared it
 * and when, "3 of 24", previous / next (arrow keys too) and Download.
 */
export function PhotoViewer({
  photos,
  index,
  eventName,
  onIndex,
  onClose
}: {
  photos: Photo[];
  index: number;
  eventName: string;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [failed, setFailed] = useState(false);
  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
      if (e.key === "ArrowRight" && index < photos.length - 1) onIndex(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onIndex]);

  if (!photo) return null;

  const download = async () => {
    setDownloading(true);
    setFailed(false);
    try {
      await downloadPhoto(eventName, photo, photos.length - index);
    } catch {
      setFailed(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal labelledBy="viewer-title" onClose={onClose} className={styles.viewer}>
      <div className={styles.viewerStage}>
        <img key={photo.id} src={photo.url} alt={`Photo shared by ${photo.sharedBy}`} />
        {hasPrev && (
          <button type="button" className={`${styles.viewerNav} ${styles.viewerPrev}`} onClick={() => onIndex(index - 1)} aria-label="Previous photo">
            <ChevronLeftIcon />
          </button>
        )}
        {hasNext && (
          <button type="button" className={`${styles.viewerNav} ${styles.viewerNext}`} onClick={() => onIndex(index + 1)} aria-label="Next photo">
            <ChevronRightIcon size={16} />
          </button>
        )}
        <button type="button" className={styles.viewerClose} onClick={onClose} aria-label="Close" data-autofocus>
          <CloseIcon size={18} />
        </button>
      </div>

      <div className={styles.viewerInfo}>
        <div className={styles.viewerText}>
          <h2 id="viewer-title" className={styles.viewerTitle}>
            Shared by {photo.sharedBy}
          </h2>
          <p>{formatPhotoTimestamp(photo.createdAt)}</p>
          <p>
            Photo {index + 1} of {photos.length}
          </p>
          {failed && <p className={styles.viewerError}>Couldn&apos;t download. Try again.</p>}
        </div>
        <button type="button" className={styles.btn} onClick={download} disabled={downloading}>
          <DownloadIcon /> {downloading ? "Downloading…" : "Download"}
        </button>
      </div>
    </Modal>
  );
}
