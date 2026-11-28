"use client";

import { useCallback, useEffect, useState } from "react";
import { listPhotos } from "@/lib/api";
import type { Photo } from "@/lib/types";

/**
 * The real photo for each report, by photo id (hidden ones included), so
 * reports show the actual picture and whether an admin hid it. Loads each
 * event's photos once; refresh() loads them again (e.g. after hiding one).
 */
export function useReportPhotos(
  reports: { eventId: string; photoId?: string }[]
): { photos: Record<string, Photo>; refresh: () => void } {
  const [photos, setPhotos] = useState<Record<string, Photo>>({});
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const eventIds = [...new Set(reports.filter((r) => r.photoId).map((r) => r.eventId))].sort().join(",");

  useEffect(() => {
    if (!eventIds) return;
    let active = true;
    Promise.all(eventIds.split(",").map((id) => listPhotos(id, { includeHidden: true }).catch(() => []))).then((lists) => {
      if (!active) return;
      const found: Record<string, Photo> = {};
      for (const photo of lists.flat()) found[photo.id] = photo;
      setPhotos(found);
    });
    return () => {
      active = false;
    };
  }, [eventIds, version]);

  return { photos, refresh };
}
