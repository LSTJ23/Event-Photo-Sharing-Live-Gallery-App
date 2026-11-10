"use client";

import { useCallback, useEffect, useState } from "react";
import { listPhotos } from "@/lib/api";
import type { Photo } from "@/lib/types";

export type PhotosState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; photos: Photo[] };

/**
 * Loads an event's photos (newest first) and re-checks for new ones every
 * `refreshMs`. Call `refresh()` to reload straight away (e.g. after removing one).
 */
export function usePhotos(eventId: string, refreshMs = 5000): PhotosState & { refresh: () => void } {
  const [state, setState] = useState<PhotosState>({ status: "loading" });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const load = () => {
      listPhotos(eventId)
        .then((photos) => {
          if (active) setState({ status: "ready", photos });
        })
        .catch(() => {
          // Keep showing what we have if a refresh fails; only error on first load.
          if (active) setState((current) => (current.status === "ready" ? current : { status: "error" }));
        })
        .finally(() => {
          if (active && refreshMs > 0) timer = setTimeout(load, refreshMs);
        });
    };
    load();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [eventId, refreshMs, version]);

  return { ...state, refresh };
}
