"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useCamera } from "@/components/useCamera";
import styles from "@/components/flow.module.css";
import { parseEventLink } from "@/lib/eventLink";

// Participants join an event in one of two ways:
// - opening the event's share link, which skips this scanner, or
// - scanning the event's QR code here. The QR code holds the same link.
// Both routes go through the participant portal before opening the camera.
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
  const [showTerms, setShowTerms] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

  if (showTerms && eventId) {
    return (
      <main className="tc-page-wrapper">
        <div className="tc-card">
          <div className="tc-header">
            <div className="tc-meta">
              <span className="tc-badge">Event Access</span>
              <span className="tc-ref">ID: {eventId}</span>
            </div>
            <h1 className="tc-title">Terms &amp; Conditions of Participation</h1>
            <p className="tc-subtitle">
              Please review the following terms and conditions carefully before joining the shared event gallery.
            </p>
          </div>

          <div className="tc-scroll-area" tabIndex={0} aria-label="Terms and Conditions Document">
            <section className="tc-section">
              <div className="tc-section-header">
                <span className="tc-section-num">01</span>
                <h2>Acceptance of Terms</h2>
              </div>
              <p>
                By accessing and participating in this event gallery, you acknowledge that you have read, understood,
                and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms,
                please decline and exit the session immediately.
              </p>
            </section>

            <section className="tc-section">
              <div className="tc-section-header">
                <span className="tc-section-num">02</span>
                <h2>Media Submissions &amp; Usage Rights</h2>
              </div>
              <p>
                Any photographs, videos, or digital content you capture or upload to this event gallery remain your
                intellectual property. However, by submitting content, you grant the event organizer and fellow
                authorized event participants a non-exclusive, royalty-free license to view, download, and share such
                media in connection with the event.
              </p>
            </section>

            <section className="tc-section">
              <div className="tc-section-header">
                <span className="tc-section-num">03</span>
                <h2>Participant Conduct &amp; Content Guidelines</h2>
              </div>
              <p>You agree to maintain respectful standards when contributing to the shared gallery. You must not upload content that:</p>
              <ul className="tc-list">
                <li>Infringes upon the privacy, publicity, or intellectual property rights of any third party.</li>
                <li>Contains unlawful, defamatory, offensive, harassing, or inappropriate material.</li>
                <li>Disrupts the integrity, security, or intended experience of the event platform.</li>
              </ul>
            </section>

            <section className="tc-section">
              <div className="tc-section-header">
                <span className="tc-section-num">04</span>
                <h2>Consent to Photograph Others</h2>
              </div>
              <p>
                Please respect the personal boundaries and privacy of all attendees. Ensure that individuals featured
                prominently in your submissions are aware of and comfortable with having their likeness uploaded to a
                shared event space.
              </p>
            </section>

            <section className="tc-section">
              <div className="tc-section-header">
                <span className="tc-section-num">05</span>
                <h2>Moderation &amp; Removal</h2>
              </div>
              <p>
                The event organizer reserves the full right to review, moderate, hide, or permanently remove any
                submitted media at their sole discretion without prior notice if it is deemed inappropriate or out of
                alignment with the event&apos;s guidelines.
              </p>
            </section>

            <section className="tc-section">
              <div className="tc-section-header">
                <span className="tc-section-num">06</span>
                <h2>Data Privacy &amp; Retention</h2>
              </div>
              <p>
                Technical session identifiers and uploaded media are processed solely for delivering the gallery
                service. Media is retained in accordance with the event organizer&apos;s configured retention schedule and
                platform privacy standards.
              </p>
            </section>

            <section className="tc-section">
              <div className="tc-section-header">
                <span className="tc-section-num">07</span>
                <h2>Limitation of Liability</h2>
              </div>
              <p>
                This platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. Neither the platform provider nor
                the event organizer shall be liable for any incidental loss of uploaded data, network interruptions, or
                unauthorized distribution of media by third-party attendees.
              </p>
            </section>
          </div>

          <div className="tc-acknowledgment">
            <label className="tc-checkbox-label">
              <input
                type="checkbox"
                className="tc-checkbox-input"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span className="tc-checkbox-box" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" className="tc-checkbox-icon">
                  <path
                    d="M3.5 8.5L6.5 11.5L12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="tc-checkbox-text">
                I have read, understood, and formally agree to abide by the Event Terms &amp; Conditions, Content
                Guidelines, and Privacy Policy.
              </span>
            </label>
          </div>

          <div className="tc-actions">
            <button
              type="button"
              className="tc-btn tc-btn-decline"
              onClick={() => {
                setShowTerms(false);
                setAgreedToTerms(false);
                setEventId(null);
              }}
            >
              Back to Scanner
            </button>
            <button
              type="button"
              className="tc-btn tc-btn-accept"
              disabled={!agreedToTerms}
              onClick={() => router.push(`/e/${encodeURIComponent(eventId)}`)}
            >
              Accept &amp; Join Event <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

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
          onClick={() => eventId && setShowTerms(true)}
          disabled={!eventId}
        >
          Continue <span aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
}
