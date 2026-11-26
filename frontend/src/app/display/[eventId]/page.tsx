"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "@/components/display/Stage";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  ExternalWindowIcon,
  GridViewIcon,
  PauseIcon,
  PlayIcon,
  PresentIcon,
  QrIcon,
  SlideshowIcon
} from "@/components/icons";
import { useOrigin } from "@/components/useOrigin";
import { usePhotos } from "@/components/usePhotos";
import styles from "@/components/display.module.css";
import { getEvent } from "@/lib/api";
import { openChannel, SLIDE_SPEEDS, type DisplayMessage, type DisplayState, type DisplayView } from "@/lib/displaySync";
import { shareLinkFor } from "@/lib/shareLink";
import type { EventInfo } from "@/lib/types";

/**
 * Presenter view, like PowerPoint's: the organizer's laptop shows the current
 * photo, what's up next, every photo to jump to, a timer and the controls,
 * while the audience screen (/display/<id>/screen, opened in its own window
 * and dragged to the projector) shows only the photos and the QR code.
 *
 * Opened from the organizer's or the admin's gallery with ?back=<page> so
 * Exit goes back there.
 */
export default function PresenterPage() {
  return (
    <Suspense fallback={<div className={styles.screen} />}>
      <Presenter />
    </Suspense>
  );
}

function Presenter() {
  const { eventId } = useParams<{ eventId: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const origin = useOrigin();
  const photos = usePhotos(eventId, 5000);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [view, setView] = useState<DisplayView>(params.get("view") === "grid" ? "grid" : "slideshow");
  const [playing, setPlaying] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [intervalMs, setIntervalMs] = useState(6000);
  // key bumps on every slide change so the progress bar and timer restart.
  const [pos, setPos] = useState({ index: 0, key: 0 });
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [lastHello, setLastHello] = useState(0);
  const channel = useRef<BroadcastChannel | null>(null);
  const latest = useRef<DisplayState | null>(null);
  const thumbs = useRef<HTMLOListElement>(null);

  const back = params.get("back")?.startsWith("/") ? params.get("back")! : "/events";
  const list = photos.status === "ready" ? photos.photos : [];
  const count = list.length;
  const index = count ? pos.index % count : 0;
  const current = count ? list[index] : null;
  const next = count > 1 ? list[(index + 1) % count] : null;
  const link = shareLinkFor(origin, eventId);
  const audienceOn = now - lastHello < 5000;

  useEffect(() => {
    getEvent(eventId).then(setEvent).catch(() => setEvent(null));
  }, [eventId]);

  // A newly shared photo (photos come newest first) jumps the queue: show it
  // straight away. Adjusting state while rendering, as React recommends.
  const newestId = list[0]?.id;
  const [shownNewest, setShownNewest] = useState(newestId);
  if (newestId !== shownNewest) {
    setShownNewest(newestId);
    if (shownNewest !== undefined) setPos((p) => ({ index: 0, key: p.key + 1 }));
  }

  const goTo = useCallback((i: number) => setPos((p) => ({ index: i, key: p.key + 1 })), []);
  const step = useCallback(
    (by: number) => setPos((p) => ({ index: count ? (((p.index + by) % count) + count) % count : 0, key: p.key + 1 })),
    [count]
  );

  // Auto-advance while playing.
  useEffect(() => {
    if (!playing || view !== "slideshow" || count < 2) return;
    const timer = setTimeout(() => step(1), intervalMs);
    return () => clearTimeout(timer);
  }, [playing, view, count, intervalMs, pos.key, step]);

  // Clock for the timer and the audience-screen status.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Talk to the audience screen.
  useEffect(() => {
    const ch = openChannel(eventId);
    channel.current = ch;
    if (!ch) return;
    ch.onmessage = (e: MessageEvent<DisplayMessage>) => {
      if (e.data.type !== "hello") return;
      setLastHello(Date.now());
      if (latest.current) ch.postMessage(latest.current);
    };
    return () => {
      ch.close();
      channel.current = null;
    };
  }, [eventId]);

  // Send the audience screen every change.
  useEffect(() => {
    const state: DisplayState = {
      type: "state",
      eventName: event?.name ?? "",
      view,
      playing,
      showQr,
      intervalMs,
      slideKey: pos.key,
      photo: current,
      photos: list
    };
    latest.current = state;
    channel.current?.postMessage(state);
  }, [event?.name, view, playing, showQr, intervalMs, pos.key, current, list]);

  // Keep the current thumbnail in view.
  useEffect(() => {
    thumbs.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  // Keyboard, including presentation clickers (they send PageUp/PageDown).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const key = e.key.toLowerCase();
      if (["arrowright", "pagedown", "n"].includes(key)) step(1);
      else if (["arrowleft", "pageup", "p"].includes(key)) step(-1);
      else if (key === " " || key === "k") {
        if (e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        setPlaying((v) => !v);
      } else if (key === "g") setView((v) => (v === "grid" ? "slideshow" : "grid"));
      else if (key === "q") setShowQr((v) => !v);
      else if (key === "home") goTo(0);
      else if (key === "end") goTo(Math.max(0, count - 1));
      else return;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, goTo, count]);

  const openAudience = () => {
    window.open(`/display/${eventId}/screen`, `audience-${eventId}`, "popup,width=1280,height=720");
  };

  const presentHere = () => {
    const here = `/display/${eventId}?back=${encodeURIComponent(back)}`;
    router.push(`/display/${eventId}/screen?back=${encodeURIComponent(here)}`);
  };

  const exit = () => {
    channel.current?.postMessage({ type: "close" } satisfies DisplayMessage);
    router.push(back);
  };

  return (
    <main className={`${styles.screen} ${styles.presenter}`}>
      <header className={styles.bar}>
        <div className={styles.title}>
          <b>{event?.name ?? "Live gallery"}</b>
          <span>
            Presenter view
            <span className={styles.liveDot} aria-hidden="true" /> Live
          </span>
        </div>
        <div className={styles.barActions}>
          <button type="button" className={styles.audienceButton} onClick={openAudience}>
            <ExternalWindowIcon /> <span>Open audience screen</span>
          </button>
          <button type="button" className={styles.roundButton} onClick={presentHere} title="No projector? Show the audience view full screen on this device">
            <PresentIcon /> <span className={styles.hideSmall}>Present on this screen</span>
          </button>
          <button type="button" className={styles.exitButton} onClick={exit}>
            <CloseIcon size={18} /> <span>Exit</span>
          </button>
        </div>
      </header>

      <p className={styles.audienceStatus} role="status">
        <span className={audienceOn ? styles.statusOn : styles.statusOff} aria-hidden="true" />
        {audienceOn
          ? "Audience screen connected. Changes here show there right away."
          : "Audience screen not open. Click “Open audience screen”, drag the window to the projector, then press F for full screen."}
      </p>

      <div className={styles.presenterBody}>
        <section className={styles.currentPane} aria-labelledby="current-label">
          <h2 id="current-label" className={styles.paneLabel}>
            {view === "slideshow" ? "Current photo" : "Audience sees: grid"}
            <span>Audience view</span>
          </h2>
          <div className={styles.preview}>
            {photos.status === "error" ? (
              <p className={styles.waiting}>Couldn&apos;t load the photos. Retrying…</p>
            ) : (
              <Stage
                compact
                view={view}
                photo={current}
                photos={list}
                showQr={showQr}
                link={origin ? link : ""}
                intervalMs={intervalMs}
                slideKey={pos.key}
                playing={playing}
                loading={photos.status === "loading"}
              />
            )}
          </div>
        </section>

        <aside className={styles.sidePane}>
          <div className={styles.paneBlock}>
            <h2 className={styles.paneLabel}>Up next</h2>
            <div className={styles.nextPreview}>
              {next && view === "slideshow" ? (
                <>
                  <img src={next.url} alt={`Next: photo shared by ${next.sharedBy}`} />
                  <span>{next.sharedBy}</span>
                </>
              ) : (
                <p>{view === "grid" ? "Grid shows every photo" : "No next photo"}</p>
              )}
            </div>
          </div>

          <div className={styles.paneBlock}>
            <div className={styles.timerRow}>
              <div>
                <div className={styles.timerLabel}>Time presenting</div>
                <div className={styles.timer}>{formatElapsed(now - startedAt)}</div>
                <button type="button" className={styles.linkButton} onClick={() => setStartedAt(Date.now())}>
                  Reset timer
                </button>
              </div>
              <div className={styles.counterWrap}>
                <div className={styles.timerLabel}>Photo</div>
                <div className={styles.counter} aria-label="Photo number">
                  {count ? `${index + 1} / ${count}` : "0 / 0"}
                </div>
              </div>
            </div>

            <div className={styles.transport}>
              <button type="button" className={styles.transportButton} onClick={() => step(-1)} disabled={count < 2} aria-label="Previous photo">
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                className={`${styles.transportButton} ${styles.playButton}`}
                onClick={() => setPlaying((v) => !v)}
                aria-label={playing ? "Pause slideshow" : "Play slideshow"}
              >
                {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
              </button>
              <button type="button" className={styles.transportButton} onClick={() => step(1)} disabled={count < 2} aria-label="Next photo">
                <ChevronRightIcon size={16} />
              </button>
            </div>

            <div className={styles.switcher} role="tablist" aria-label="Audience view">
              <button type="button" role="tab" aria-selected={view === "slideshow"} onClick={() => setView("slideshow")}>
                <SlideshowIcon /> <span>Slideshow</span>
              </button>
              <button type="button" role="tab" aria-selected={view === "grid"} onClick={() => setView("grid")}>
                <GridViewIcon /> <span>Grid</span>
              </button>
            </div>

            <div className={styles.optionRow}>
              <label className={styles.option}>
                <span>Change photo every</span>
                <select value={intervalMs} onChange={(e) => setIntervalMs(Number(e.target.value))}>
                  {SLIDE_SPEEDS.map((ms) => (
                    <option key={ms} value={ms}>
                      {ms / 1000} seconds
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className={styles.qrToggle} aria-pressed={showQr} onClick={() => setShowQr((v) => !v)}>
                <QrIcon size={18} /> {showQr ? "QR shown" : "QR hidden"}
              </button>
            </div>

            <p className={styles.keys}>
              <kbd>←</kbd> <kbd>→</kbd> or clicker: previous / next · <kbd>Space</kbd> play / pause · <kbd>G</kbd> grid · <kbd>Q</kbd> QR
            </p>
          </div>
        </aside>
      </div>

      <section className={styles.thumbPane} aria-label="All photos. Click one to show it.">
        {count === 0 ? (
          <p className={styles.thumbEmpty}>{photos.status === "loading" ? "Loading photos…" : "No photos yet. They show up here as guests share them."}</p>
        ) : (
          <ol ref={thumbs} className={styles.thumbs}>
            {list.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-current={i === index}
                  aria-label={`Show photo ${i + 1}, shared by ${p.sharedBy}`}
                  onClick={() => {
                    goTo(i);
                    setView("slideshow");
                  }}
                >
                  <img src={p.url} alt="" loading="lazy" />
                  <span>{i + 1}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
