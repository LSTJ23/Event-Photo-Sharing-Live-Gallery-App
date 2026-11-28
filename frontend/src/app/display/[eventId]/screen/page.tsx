"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "@/components/display/Stage";
import { CloseIcon, FullscreenIcon } from "@/components/icons";
import { useOrigin } from "@/components/useOrigin";
import { usePhotos } from "@/components/usePhotos";
import styles from "@/components/display.module.css";
import { getEvent } from "@/lib/api";
import { openChannel, type DisplayMessage, type DisplayState } from "@/lib/displaySync";
import { shareLinkFor } from "@/lib/shareLink";

const STANDALONE_MS = 6000;

/**
 * The audience screen: what goes on the projector or TV. Normally the
 * presenter view (/display/<id>) opens it in its own window and controls it.
 * Opened on its own, it plays the slideshow by itself.
 */
export default function AudienceScreenPage() {
  return (
    <Suspense fallback={<div className={styles.screen} />}>
      <AudienceScreen />
    </Suspense>
  );
}

function AudienceScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const origin = useOrigin();
  const photos = usePhotos(eventId, 5000);
  const [remote, setRemote] = useState<DisplayState | null>(null);
  const [eventName, setEventName] = useState("");
  const [index, setIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const back = params.get("back")?.startsWith("/") ? params.get("back")! : `/display/${eventId}`;
  const own = photos.status === "ready" ? photos.photos : [];

  const exit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    if (window.opener) window.close();
    else router.push(back);
  }, [back, router]);

  // Listen to the presenter; say hello now and every couple of seconds so it knows we're here.
  useEffect(() => {
    const channel = openChannel(eventId);
    if (!channel) return;
    const hello = () => channel.postMessage({ type: "hello" } satisfies DisplayMessage);
    channel.onmessage = (e: MessageEvent<DisplayMessage>) => {
      if (e.data.type === "state") setRemote(e.data);
      // Presenter pressed Exit: close this window if the presenter opened it.
      if (e.data.type === "close" && window.opener) window.close();
    };
    hello();
    const timer = setInterval(hello, 2000);
    return () => {
      clearInterval(timer);
      channel.close();
    };
  }, [eventId]);

  useEffect(() => {
    getEvent(eventId)
      .then((event) => setEventName(event?.name ?? ""))
      .catch(() => {});
  }, [eventId]);

  // On its own (no presenter), play through the photos by itself.
  useEffect(() => {
    if (remote || own.length < 2) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % own.length), STANDALONE_MS);
    return () => clearTimeout(timer);
  }, [remote, own.length, index]);

  // Exit and full-screen buttons show when the mouse moves, then fade away.
  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2500);
  }, []);

  useEffect(() => {
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2500);
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") toggleFull();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(hideTimer.current);
    };
  }, []);

  const view = remote?.view ?? "slideshow";
  const list = remote?.photos ?? own;
  const photo = remote ? remote.photo : (own[index % Math.max(1, own.length)] ?? null);

  return (
    <main className={`${styles.screen} ${styles.audience}`} onMouseMove={showControls} onClick={showControls}>
      <header className={styles.audienceTitle}>
        <b>{remote?.eventName || eventName}</b>
        <span>
          <span className={styles.liveDot} aria-hidden="true" /> Live
        </span>
      </header>

      <Stage
        view={view}
        photo={photo}
        photos={list}
        showQr={remote?.showQr ?? true}
        link={shareLinkFor(origin, eventId)}
        intervalMs={remote?.intervalMs ?? STANDALONE_MS}
        slideKey={remote?.slideKey ?? index}
        playing={remote?.playing ?? true}
        loading={!remote && photos.status === "loading"}
      />

      <div className={`${styles.floatingControls} ${controlsVisible ? "" : styles.hidden}`}>
        <button type="button" className={styles.roundButton} onClick={toggleFull} aria-label="Full screen">
          <FullscreenIcon />
        </button>
        <button type="button" className={styles.exitButton} onClick={exit}>
          <CloseIcon size={18} /> <span>Exit</span>
        </button>
      </div>
    </main>
  );
}

function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}
