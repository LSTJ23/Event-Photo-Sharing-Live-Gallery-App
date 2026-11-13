"use client";
/* eslint-disable @next/next/no-img-element -- photos are local blob: URLs, which next/image can't optimise */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useEventSession } from "@/components/EventSession";
import { ScreenHeader } from "@/components/ScreenHeader";
import styles from "@/components/flow.module.css";

export default function PreviewPage() {
  const router = useRouter();
  const { event, draft, clearDraft } = useEventSession();
  const cameraHref = `/e/${event.id}/camera`;

  // Arriving here without a photo (e.g. after a refresh) → back to the camera.
  useEffect(() => {
    if (!draft) router.replace(cameraHref);
  }, [draft, router, cameraHref]);

  if (!draft) return null;

  return (
    <main className={styles.screen}>
      <ScreenHeader title="Photo Preview" />

      <div className={styles.body}>
        <div className={styles.previewFrame}>
          <img src={draft.url} alt="The photo you just took" />
          <p className={styles.readyBadge} role="status">
            <span className={styles.readyCheck} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Photo ready
          </p>
        </div>
      </div>

      <div className={`${styles.footer} ${styles.footerRow}`}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => {
            router.push(cameraHref);
            clearDraft();
          }}
        >
          Retake
        </button>
        <Link href={`/e/${event.id}/share`} className={styles.btnPrimary}>
          Next <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
