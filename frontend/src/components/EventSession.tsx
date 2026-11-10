"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getEvent } from "@/lib/api";
import type { EventInfo } from "@/lib/types";
import adminStyles from "./admin.module.css";
import styles from "./flow.module.css";

interface PhotoDraft {
  blob: Blob;
  url: string;
}

interface EventSessionValue {
  event: EventInfo;
  /** The photo the participant just took, waiting to be shared. */
  draft: PhotoDraft | null;
  setDraft: (blob: Blob) => void;
  clearDraft: () => void;
}

const EventSessionContext = createContext<EventSessionValue | null>(null);

export function useEventSession(): EventSessionValue {
  const value = useContext(EventSessionContext);
  if (!value) throw new Error("useEventSession must be used inside <EventSession>");
  return value;
}

type LoadState = { status: "loading" } | { status: "missing" } | { status: "error" } | { status: "ready"; event: EventInfo };

export function EventSession({
  eventId,
  children,
  variant = "participant"
}: {
  eventId: string;
  children: React.ReactNode;
  /** "admin" shows loading and error messages in the desktop admin layout. */
  variant?: "participant" | "admin";
}) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [draft, setDraftState] = useState<PhotoDraft | null>(null);
  const draftUrl = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    getEvent(eventId)
      .then((event) => {
        if (active) setLoad(event ? { status: "ready", event } : { status: "missing" });
      })
      .catch(() => {
        if (active) setLoad({ status: "error" });
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  const setDraft = useCallback((blob: Blob) => {
    if (draftUrl.current) URL.revokeObjectURL(draftUrl.current);
    const url = URL.createObjectURL(blob);
    draftUrl.current = url;
    setDraftState({ blob, url });
  }, []);

  // The shared photo keeps its own copy of the image, so the draft URL can go.
  const clearDraft = useCallback(() => {
    if (draftUrl.current) URL.revokeObjectURL(draftUrl.current);
    draftUrl.current = null;
    setDraftState(null);
  }, []);

  useEffect(
    () => () => {
      if (draftUrl.current) URL.revokeObjectURL(draftUrl.current);
    },
    []
  );

  if (load.status !== "ready" && variant === "admin") {
    return (
      <main className={adminStyles.page}>
        <div className={adminStyles.statusMessage}>
          {load.status === "loading" ? (
            <p className={adminStyles.muted}>Loading event…</p>
          ) : (
            <>
              <h1>{load.status === "missing" ? "Event not found" : "Something went wrong"}</h1>
              <p className={adminStyles.muted}>
                {load.status === "missing"
                  ? "This event doesn't exist, or it was removed."
                  : "We couldn't load this event. Check your connection and try again."}
              </p>
            </>
          )}
        </div>
      </main>
    );
  }

  if (load.status !== "ready") {
    return (
      <div className={styles.screen}>
        <div className={styles.centered}>
          {load.status === "loading" ? (
            <p className={styles.muted}>Loading event…</p>
          ) : (
            <>
              <h1 className={styles.statusTitle}>
                {load.status === "missing" ? "Event not found" : "Something went wrong"}
              </h1>
              <p className={styles.muted}>
                {load.status === "missing"
                  ? "Check the QR code or link with the event organizer and try again."
                  : "We couldn't load this event. Check your connection and try again."}
              </p>
            </>
          )}
        </div>
        {load.status !== "loading" && (
          <div className={styles.footer}>
            <Link href="/scan" className={styles.btnSecondary}>
              Scan again
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <EventSessionContext.Provider value={{ event: load.event, draft, setDraft, clearDraft }}>
      {children}
    </EventSessionContext.Provider>
  );
}
