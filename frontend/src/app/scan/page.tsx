"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useCamera } from "@/components/useCamera";
import styles from "@/components/flow.module.css";
import { parseEventLink } from "@/lib/eventLink";

// Participants join an event in one of two ways:
// - opening the event's share link, which skips this page and goes straight
//   to the camera (see app/e/[eventId]/page.tsx), or
// - scanning the event's QR code here. The QR code holds the same link.
//
// QR scanning uses the browser's built-in BarcodeDetector (Chrome and Edge,
// including on Android). Safari and Firefox don't have it; there, people scan
// the QR code with their phone's own Camera app, which opens the share link.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike;

function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  const candidate = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  return candidate ?? null;
}

export default function ScanPage() {
  const router = useRouter();
  const { videoRef, status } = useCamera("environment");
  const [eventId, setEventId] = useState<string | null>(null);
  const [scannerMissing, setScannerMissing] = useState(false);

  // Look for an event QR code in the camera feed a few times a second.
  useEffect(() => {
    if (status !== "ready" || eventId) return;
    const Detector = getBarcodeDetector();
    let detector: BarcodeDetectorLike | null = null;
    try {
      detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;
    } catch {
      detector = null;
    }
    if (!detector) {
      const timer = setTimeout(() => setScannerMissing(true), 0);
      return () => clearTimeout(timer);
    }

    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const scan = async () => {
      const video = videoRef.current;
      if (stopped || !video || !detector) return;
      try {
        const codes = video.readyState >= 2 ? await detector.detect(video) : [];
        for (const code of codes) {
          const id = parseEventLink(code.rawValue);
          if (id) {
            navigator.vibrate?.(40);
            setEventId(id);
            return;
          }
        }
      } catch {
        // A frame that fails to decode is normal; try the next one.
      }
      if (!stopped) timer = setTimeout(scan, 250);
    };
    timer = setTimeout(scan, 250);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [status, eventId, videoRef]);

  const cameraMessage =
    status === "denied"
      ? "Camera access is blocked. Allow it in your browser settings, or open the event link from the organizer."
      : status === "unsupported" || status === "error"
        ? "We couldn't open your camera. Open the event link from the organizer instead."
        : scannerMissing
          ? "This browser can't scan QR codes. Scan the event's QR code with your phone's Camera app, or open the event link from the organizer."
          : null;

  return (
    <main className={styles.screen}>
      <ScreenHeader title="Scan event QR code" />

      <div className={styles.body}>
        <div className={`${styles.viewfinder} ${status === "ready" ? styles.viewfinderLive : ""}`}>
          <video ref={videoRef} playsInline muted aria-label="Camera view for scanning the QR code" />
          <div className={styles.scanTarget}>
            <span />
          </div>
          {cameraMessage && <p className={styles.viewfinderMessage}>{cameraMessage}</p>}
        </div>

        {eventId ? (
          <p className={styles.found} role="status">
            Event found ✓
          </p>
        ) : (
          <p className={styles.instructions}>Point your camera at the event&apos;s QR code to join the gallery</p>
        )}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => eventId && router.push(`/e/${eventId}/camera`)}
          disabled={!eventId}
        >
          Continue <span aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
}
