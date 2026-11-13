"use client";
/* eslint-disable @next/next/no-img-element -- photos are local blob: URLs, which next/image can't optimise */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useEventSession } from "@/components/EventSession";
import { ScreenHeader } from "@/components/ScreenHeader";
import styles from "@/components/flow.module.css";
import { uploadPhoto } from "@/lib/api";
import { getCurrentUser } from "@/lib/currentUser";

type ShareState = "ready" | "sharing" | "shared" | "failed";

export default function SharePage() {
  const router = useRouter();
  const { event, draft, clearDraft } = useEventSession();
  const [state, setState] = useState<ShareState>("ready");
  const [anonymous, setAnonymous] = useState(false);
  const userName = getCurrentUser().name;
  const cameraHref = `/e/${event.id}/camera`;

  useEffect(() => {
    if (!draft && (state === "ready" || state === "failed")) router.replace(cameraHref);
  }, [draft, state, router, cameraHref]);

  const share = async () => {
    if (!draft) return;
    setState("sharing");
    try {
      await uploadPhoto(event.id, draft.blob, { anonymous });
      clearDraft();
      setState("shared");
    } catch {
      setState("failed");
    }
  };

  // 03b — Sharing success
  if (state === "shared") {
    return (
      <main className={styles.screen}>
        <div className={styles.centered}>
          <div className={styles.checkCircle} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className={styles.statusTitle}>Photo shared!</h1>
          <p className={styles.muted}>
            Everyone at the event can now see it{anonymous ? ", shared anonymously" : ""}.
          </p>
        </div>
        <div className={styles.footer}>
          <Link href={cameraHref} className={styles.btnPrimary}>
            Take Another Photo
          </Link>
          <Link href={`/e/${event.id}/gallery`} className={styles.textLink}>
            View event gallery
          </Link>
        </div>
      </main>
    );
  }

  if (!draft) return null;
  const sharing = state === "sharing";

  // 03 — Upload / Share
  return (
    <main className={styles.screen}>
      <ScreenHeader title="Share Photo" />

      <div className={styles.body}>
        <div className={styles.shareThumb}>
          <img src={draft.url} alt="The photo you're about to share" />
        </div>
        <div className={styles.shareText}>
          <h2>Ready to Share?</h2>
          <p className={styles.muted}>Your photo will be visible to other event participants.</p>
        </div>
        <div className={styles.toggleRow}>
          <div>
            <p id="anonymous-label" className={styles.toggleLabel}>
              Share anonymously
            </p>
            <p className={styles.toggleHint}>
              {anonymous ? "Your name won't be shown in the gallery." : `Shown in the gallery as ${userName}.`}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={anonymous}
            aria-labelledby="anonymous-label"
            className={styles.switch}
            disabled={sharing}
            onClick={() => setAnonymous((on) => !on)}
          >
            <span className={styles.switchThumb} />
          </button>
        </div>
        <div className={styles.spacer} />
        {state === "failed" && (
          <p className={styles.error} role="alert">
            Your photo didn&apos;t upload. Check your connection and try again.
          </p>
        )}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.btnPrimary} onClick={share} disabled={sharing}>
          {sharing ? "Sharing…" : state === "failed" ? "Try Again" : "Share Photo"}
        </button>
        <button
          type="button"
          className={styles.btnSecondary}
          disabled={sharing}
          onClick={() => {
            router.push(cameraHref);
            clearDraft();
          }}
        >
          Change Photo
        </button>
      </div>
    </main>
  );
}
