"use client";

import { useState } from "react";
import { CheckIcon, FlagIcon } from "./icons";
import { Modal } from "./Modal";
import styles from "./flow.module.css";
import { reportPhoto } from "@/lib/api";
import { DETAILS_MAX, REPORT_REASONS, reportFormError } from "@/lib/reportReasons";

/**
 * Participant: report a photo. Pick a reason from the dropdown (and a few words
 * if it's "Other"), then Send. The event organizer reviews it.
 */
export function ReportPhotoDialog({
  eventId,
  photoId,
  onReported,
  onClose
}: {
  eventId: string;
  photoId: string;
  onReported: () => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const error = reportFormError(reason, details);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (error) return;
    setSending(true);
    setFailed(false);
    try {
      await reportPhoto(eventId, photoId, { reason, details: details.trim() || undefined });
      setSent(true);
      onReported();
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Modal labelledBy="report-title" onClose={onClose} className={styles.reportDialog}>
        <span className={`${styles.reportIcon} ${styles.reportIconDone}`} aria-hidden="true">
          <CheckIcon size={22} />
        </span>
        <h2 id="report-title" className={styles.reportTitle}>
          Thanks for letting us know
        </h2>
        <p className={styles.reportText}>The event organizer will review this photo.</p>
        <button type="button" className={styles.btnPrimary} onClick={onClose} data-autofocus>
          Done
        </button>
      </Modal>
    );
  }

  return (
    <Modal labelledBy="report-title" onClose={onClose} className={styles.reportDialog}>
      <form onSubmit={send} noValidate className={styles.reportForm}>
        <span className={styles.reportIcon} aria-hidden="true">
          <FlagIcon size={20} />
        </span>
        <h2 id="report-title" className={styles.reportTitle}>
          Report this photo
        </h2>
        <p className={styles.reportText}>Only the event organizer sees reports. Whoever shared the photo won&apos;t know it was you.</p>

        <label className={styles.reportField}>
          <span>
            <span>
              Reason
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            </span>
            <small>Required</small>
          </span>
          <select required aria-required="true" value={reason} onChange={(e) => setReason(e.target.value)} data-autofocus aria-describedby={tried && error ? "report-error" : undefined}>
            <option value="" disabled>
              Choose a reason
            </option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.reportField}>
          <span>
            {reason === "Other" ? "Tell us more" : "More details (optional)"}
            <small>
              {details.length}/{DETAILS_MAX}
            </small>
          </span>
          <textarea rows={3} value={details} maxLength={DETAILS_MAX} onChange={(e) => setDetails(e.target.value)} placeholder="Anything that helps the organizer decide" />
        </label>

        {tried && error && (
          <p id="report-error" className={styles.error} role="alert">
            {error}
          </p>
        )}
        {failed && (
          <p className={styles.error} role="alert">
            Couldn&apos;t send the report. Check your connection and try again.
          </p>
        )}

        <div className={styles.reportActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={sending}>
            {sending ? "Sending…" : "Send report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
