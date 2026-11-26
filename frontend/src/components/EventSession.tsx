"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getEvent } from "@/lib/api";
import { AuthRequestError, getParticipantEvent, type AuthUser } from "@/lib/auth";
import { useCurrentUser } from "./useCurrentUser";
import type { EventInfo } from "@/lib/types";
import adminStyles from "./admin.module.css";
import styles from "./flow.module.css";

interface PhotoDraft {
  blob: Blob;
  url: string;
}

interface EventSessionValue {
  event: EventInfo;
  user: AuthUser;
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
  /** "admin" shows loading and error messages in the organizer dashboard's style. */
  variant?: "participant" | "admin";
}) {
  const pathname = usePathname();
  if (variant === "participant" && pathname.split("/").filter(Boolean).length === 2) {
    return <>{children}</>;
  }
  return <LoadedEventSession eventId={eventId} variant={variant}>{children}</LoadedEventSession>;
}

function LoadedEventSession({
  eventId,
  children,
  variant
}: {
  eventId: string;
  children: React.ReactNode;
  variant: "participant" | "admin";
}) {
  const [loaded, setLoaded] = useState<{ eventId: string; variant: "participant" | "admin"; value: LoadState }>({
    eventId, variant, value: { status: "loading" }
  });
  const load: LoadState = loaded.eventId === eventId && loaded.variant === variant
    ? loaded.value : { status: "loading" };
  const currentUser = useCurrentUser(eventId);
  const [draft, setDraftState] = useState<PhotoDraft | null>(null);
  const draftUrl = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const setLoad = (value: LoadState) => setLoaded({ eventId, variant, value });
    (variant === "participant" ? getParticipantEvent(eventId) : getEvent(eventId))
      .then((event) => {
        if (active) setLoad(event ? { status: "ready", event } : { status: "missing" });
      })
      .catch((error: unknown) => {
        if (active) setLoad(error instanceof AuthRequestError && error.status === 404 ? { status: "missing" } : { status: "error" });
      });
    return () => {
      active = false;
    };
  }, [eventId, variant]);

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

  if (currentUser.status !== "ready" || currentUser.user.mustChangePassword) {
    return (
      <main className={styles.screen}>
        <div className={styles.centered}>
          {currentUser.status === "loading" ? <p>Checking your session...</p> : currentUser.status === "error" ? (
            <p role="alert">Unable to check your session. Check your connection and try again.</p>
          ) : (
            <>
              <p>Sign in to continue.</p>
              <Link href={variant === "participant" ? `/portal?event=${encodeURIComponent(eventId)}` : "/portal"} className={styles.btnSecondary}>Go to login</Link>
            </>
          )}
        </div>
      </main>
    );
  }

  if (load.status !== "ready" && variant === "admin") {
    return (
      <div>
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
      </div>
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
            <Link href="/portal" className={styles.btnSecondary}>
              Back to portal
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <EventSessionContext.Provider value={{ event: load.event, user: currentUser.user, draft, setDraft, clearDraft }}>
      {children}
    </EventSessionContext.Provider>
  );
}
