"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "../icons";
import { Modal } from "../Modal";
import { useAdminStore } from "./AdminStore";
import { useHere, withFrom } from "./useBackTo";
import styles from "./dashboard.module.css";
import { formatWhen, type AdminReport } from "@/lib/adminData";

const statusText = (r: AdminReport, orgName: string) =>
  r.state === "waiting" ? `Waiting for ${orgName}` : `${r.state === "kept" ? "Kept" : "Removed"} by ${orgName}`;

/**
 * Popup: a reported photo, every report on it, its event and organizer, and
 * what the organizer decided. Given several photos, it shows "‹ 1 of 3 ›"
 * arrows to go through them.
 */
export function ReportDetails({ reports, onClose }: { reports: AdminReport[]; onClose: () => void }) {
  const { getEvent, getOrganizer } = useAdminStore();
  const here = useHere();
  const [index, setIndex] = useState(0);
  const report = reports[Math.min(index, reports.length - 1)];
  const event = getEvent(report.eventId);
  const org = event ? getOrganizer(event.organizerId) : undefined;
  const orgName = org?.org ?? "the organizer";

  return (
    <Modal labelledBy="report-title" onClose={onClose} className={styles.detailDialog}>
      <div className={styles.detailHead}>
        <h2 id="report-title">Reported photo</h2>
        {reports.length > 1 && (
          <span className={styles.pager}>
            <button type="button" onClick={() => setIndex((i) => i - 1)} disabled={index === 0} aria-label="Previous photo">
              <ChevronLeftIcon />
            </button>
            <span aria-live="polite">
              {index + 1} of {reports.length}
            </span>
            <button type="button" onClick={() => setIndex((i) => i + 1)} disabled={index === reports.length - 1} aria-label="Next photo">
              <ChevronRightIcon />
            </button>
          </span>
        )}
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close" data-autofocus>
          <CloseIcon />
        </button>
      </div>
      <span className={styles.detailPhoto} style={{ background: report.shade }} role="img" aria-label={`Photo shared by ${report.sharedBy}`} />
      <dl className={styles.details}>
        <dt>Status</dt>
        <dd>
          <span className={`${styles.pill} ${report.state === "waiting" ? styles.pillWarn : ""}`}>{statusText(report, orgName)}</span>
          {report.decidedAt && <span className={styles.muted}> · {report.decidedAt}</span>}
        </dd>
        <dt>Event</dt>
        <dd>
          {event ? (
            <>
              {event.name}
              <div className={styles.itemMeta}>
                {formatWhen(event.date, event.time, event.endDate, event.endTime)} · {event.venue}
              </div>
            </>
          ) : (
            "Deleted event"
          )}
        </dd>
        <dt>Organizer</dt>
        <dd>
          {org ? (
            <>
              {org.org} ({org.person})<div className={styles.itemMeta}>{org.email}</div>
            </>
          ) : (
            "Unknown"
          )}
        </dd>
        <dt>Shared by</dt>
        <dd>{report.sharedBy}</dd>
        <dt>First reported</dt>
        <dd>{report.time}</dd>
      </dl>
      <div>
        <h3 className={styles.subhead}>
          {report.count} report{report.count === 1 ? "" : "s"}
        </h3>
        <ul className={styles.entries}>
          {report.entries.map((e, i) => (
            <li key={i}>
              <span>
                <b>{e.reason}</b>
                <div className={styles.itemMeta}>by {e.by}</div>
              </span>
              <span className={styles.muted}>{e.time}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.note} style={{ margin: 0 }}>
        Only {orgName} can keep or remove this photo.
      </p>
      <div className={styles.detailActions}>
        {event && (
          <Link href={withFrom(`/admin/events/${event.id}/gallery`, here)} className={styles.btn}>
            Open gallery
          </Link>
        )}
        {org && report.state === "waiting" && (
          <a
            className={styles.btnDark}
            href={`mailto:${org.email}?subject=${encodeURIComponent(`Reported photo in ${event?.name ?? "your event"}`)}`}
          >
            Remind organizer
          </a>
        )}
      </div>
    </Modal>
  );
}
