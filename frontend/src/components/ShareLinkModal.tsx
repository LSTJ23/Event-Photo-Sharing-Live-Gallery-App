"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import { displayLink } from "@/lib/shareLink";
import styles from "./admin.module.css";
import { CheckIcon, CopyIcon, DownloadIcon, LinkIcon } from "./icons";
import { Modal } from "./Modal";
import { downloadQrPng, QrCode } from "./QrCode";

/**
 * 07 Public Share Link → 08 Link copied.
 * Shows the event's share link and its QR code, with Copy Link and Download QR
 * Code buttons; once copied, the same dialog changes to "Link copied!".
 */
export type CopyState = "ready" | "copied" | "failed";

export function ShareLinkModal({
  link,
  eventId,
  onClose,
  initialState = "ready"
}: {
  link: string;
  /** Used to name the downloaded QR code file. */
  eventId: string;
  onClose: () => void;
  /** Open straight on "Link copied!" (or the copy-failed note) when the copy already happened. */
  initialState?: CopyState;
}) {
  const [state, setState] = useState<CopyState>(initialState);

  const copy = async () => {
    setState((await copyText(link)) ? "copied" : "failed");
  };

  if (state === "copied") {
    return (
      <Modal key="copied" labelledBy="link-copied-title" onClose={onClose}>
        <span className={`${styles.dialogIcon} ${styles.dialogCheck}`} aria-hidden="true">
          <CheckIcon size={20} strokeWidth={3} />
        </span>
        <h2 id="link-copied-title" className={styles.dialogTitle}>
          Link copied!
        </h2>
        <p className={styles.dialogText}>Share it with your event participants.</p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.btnDark} onClick={onClose} data-autofocus>
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal key="ready" labelledBy="share-link-title" onClose={onClose}>
      <span className={styles.dialogIcon} aria-hidden="true">
        <LinkIcon size={20} />
      </span>
      <h2 id="share-link-title" className={styles.dialogTitle}>
        Public Share Link
      </h2>
      <p className={styles.dialogText}>Anyone with this link or QR code can join the event gallery.</p>
      <QrCode value={link} size={168} className={styles.dialogQr} />
      <div className={styles.linkField}>
        <span title={link}>{displayLink(link)}</span>
        <button type="button" className={styles.linkCopy} onClick={copy} aria-label="Copy link">
          <CopyIcon />
        </button>
      </div>
      {state === "failed" && (
        <p className={styles.dialogError} role="alert">
          Couldn&apos;t copy automatically. Select the link above and copy it.
        </p>
      )}
      <div className={styles.dialogActions}>
        <button type="button" className={styles.btnDark} onClick={copy} data-autofocus>
          <CopyIcon /> Copy Link
        </button>
        <button type="button" className={styles.btn} onClick={() => downloadQrPng(link, `${eventId}-qr-code.png`)}>
          <DownloadIcon /> Download QR Code
        </button>
        <button type="button" className={styles.textButton} onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
