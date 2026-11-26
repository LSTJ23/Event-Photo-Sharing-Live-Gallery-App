"use client";

import { useState } from "react";
import { DownloadIcon } from "./icons";
import { listPhotos } from "@/lib/api";
import { downloadAllPhotos } from "@/lib/downloadPhotos";

/**
 * "Download all photos": zips every photo of the event and downloads it.
 * Styling comes from the page (pass its button class).
 */
export function DownloadPhotosButton({
  eventId,
  eventName,
  className,
  label = "Download all photos",
  onDone
}: {
  eventId: string;
  eventName: string;
  className?: string;
  label?: string;
  /** Called with a message to show, e.g. "Downloaded 12 photos". */
  onDone?: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const photos = await listPhotos(eventId);
      if (photos.length === 0) {
        onDone?.("This event has no photos to download.");
        return;
      }
      const count = await downloadAllPhotos(eventName, photos);
      onDone?.(`Downloaded ${count} ${count === 1 ? "photo" : "photos"}`);
    } catch {
      onDone?.("Couldn't download the photos. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className={className} onClick={download} disabled={busy} aria-busy={busy}>
      <DownloadIcon /> {busy ? "Preparing…" : label}
    </button>
  );
}
