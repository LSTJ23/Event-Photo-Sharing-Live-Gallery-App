"use client";

import { useParams } from "next/navigation";
import { CopyIcon, DownloadIcon } from "@/components/icons";
import { PageHeading } from "@/components/organizer/PageHeading";
import { useOrganizerStore } from "@/components/organizer/OrganizerStore";
import { downloadQrPng, QrCode } from "@/components/QrCode";
import { useOrigin } from "@/components/useOrigin";
import styles from "@/components/organizer.module.css";
import { copyText } from "@/lib/clipboard";
import { displayLink, shareLinkFor } from "@/lib/shareLink";

/** The event's QR code and share link, to copy, download or print. */
export default function QrPage() {
  const { id } = useParams<{ id: string }>();
  const { getEvent, notify } = useOrganizerStore();
  const origin = useOrigin();
  const event = getEvent(id);

  if (!event) {
    return (
      <>
        <PageHeading title="QR code" backHref="/events" backLabel="Events" />
        <p className={styles.empty}>Event not found.</p>
      </>
    );
  }

  const link = shareLinkFor(origin, event.id);
  const copy = async () => notify((await copyText(link)) ? "Link copied" : "Couldn't copy. Select the link and copy it.");

  return (
    <>
      <PageHeading title="QR code" subtitle={`${event.name} · ${event.when}`} backHref="/events" backLabel="Events" />
      <section className={styles.qrPanel} aria-label="Event QR code">
        <p className={styles.muted}>Guests scan this code, or open the link, to join the event and share photos.</p>
        {origin && (
          <>
            <div style={{ marginTop: "1.25rem" }}>
              <QrCode value={link} size={240} className={styles.qrImage} />
            </div>
            <div className={styles.linkField}>
              <span title={link}>{displayLink(link)}</span>
              <button type="button" className={styles.linkCopy} onClick={copy} aria-label="Copy link">
                <CopyIcon />
              </button>
            </div>
            <div className={styles.stackedButtons}>
              <button type="button" className={styles.btnDark} onClick={copy}>
                <CopyIcon /> Copy Link
              </button>
              <button type="button" className={styles.btn} onClick={() => downloadQrPng(link, `${event.id}-qr-code.png`)}>
                <DownloadIcon /> Download QR Code
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
