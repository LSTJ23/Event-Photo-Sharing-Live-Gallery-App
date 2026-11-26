"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { CopyIcon, DownloadIcon } from "@/components/icons";
import { PageHeader } from "@/components/admin/AdminShell";
import { useBackTo } from "@/components/admin/useBackTo";
import { useAdminStore } from "@/components/admin/AdminStore";
import { downloadQrPng, QrCode } from "@/components/QrCode";
import { useOrigin } from "@/components/useOrigin";
import styles from "@/components/admin/dashboard.module.css";
import { formatWhen } from "@/lib/adminData";
import { copyText } from "@/lib/clipboard";
import { displayLink, shareLinkFor } from "@/lib/shareLink";

/**
 * An event's QR code and share link, to copy, download or print. Back goes to
 * where you came from: the page in ?from= (e.g. the event's Gallery), otherwise Manage Events.
 */
export default function AdminQrPage() {
  // useSearchParams needs a Suspense boundary in the Next.js App Router.
  return (
    <Suspense fallback={null}>
      <QrContent />
    </Suspense>
  );
}

function QrContent() {
  const { id } = useParams<{ id: string }>();
  const back = useBackTo("/admin/events");
  const { getEvent, notify } = useAdminStore();
  const origin = useOrigin();
  const event = getEvent(id);

  if (!event) return <PageHeader title="Event not found" back={back} subtitle="It may have been deleted, or the link is wrong." />;

  const link = shareLinkFor(origin, event.id);
  const copy = async () => notify((await copyText(link)) ? "Link copied" : "Couldn't copy. Select the link and copy it.");

  return (
    <div className={styles.centered}>
      <PageHeader title="QR code" back={back} subtitle={`${event.name} · ${formatWhen(event.date, event.time, event.endDate, event.endTime)}`} />
      <section className={`${styles.card} ${styles.qrCard}`} aria-label="Event QR code">
        <p className={styles.muted} style={{ margin: 0 }}>
          Guests scan this code, or open the link, to join the event and share photos.
        </p>
        {origin && (
          <>
            <QrCode value={link} size={240} className={styles.qrImage} />
            <p className={styles.qrLink}>{displayLink(link)}</p>
            <div className={styles.headerButtons}>
              <button type="button" className={styles.btn} onClick={copy}>
                <CopyIcon /> Copy link
              </button>
              <button type="button" className={styles.btnDark} onClick={() => downloadQrPng(link, `${event.id}-qr.png`)}>
                <DownloadIcon /> Download QR code
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
