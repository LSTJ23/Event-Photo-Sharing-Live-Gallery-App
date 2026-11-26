"use client";

import { useState } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { PageHeader } from "@/components/admin/AdminShell";
import { ReportDetails } from "@/components/admin/ReportDetails";
import { useFrom } from "@/components/admin/useBackTo";
import { useAdminStore } from "@/components/admin/AdminStore";
import styles from "@/components/admin/dashboard.module.css";
import { getStats, type AdminReport } from "@/lib/adminData";

/**
 * Report logs: the totals and reported photos. Click a reported photo for the
 * details in a popup.
 * Reported photos are view-only: only the event's organizer can keep or remove them.
 */
export default function ReportLogsPage() {
  const { events, organizers, reports, getEvent, getOrganizer } = useAdminStore();
  const from = useFrom();
  const [openReport, setOpenReport] = useState<AdminReport | null>(null);
  const stats = getStats(events, organizers);

  return (
    <>
      <PageHeader title="Report Logs" back={from} />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Total events</div>
          <div className={styles.statValue}>{stats.totalEvents}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Active events</div>
          <div className={styles.statValue}>{stats.activeEvents}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Active users</div>
          <div className={styles.statValue}>{stats.activeUsers}</div>
        </div>
      </div>

      <section className={styles.card} aria-labelledby="reported-title">
        <div className={styles.cardHead}>
          <h2 id="reported-title" className={styles.cardTitle}>
            Reported Photos
          </h2>
          <span className={styles.muted} style={{ fontSize: 13 }}>
            {reports.filter((r) => r.state === "waiting").length} waiting
          </span>
        </div>
        {reports.length === 0 ? (
          <p className={styles.muted}>No photos have been reported.</p>
        ) : (
          <ul className={styles.list}>
            {reports.map((r) => {
              const event = getEvent(r.eventId);
              const org = event ? getOrganizer(event.organizerId) : undefined;
              return (
                <li key={r.id}>
                  <button type="button" className={styles.rowButton} onClick={() => setOpenReport(r)}>
                    <span className={styles.thumb} style={{ background: r.shade }} aria-hidden="true" />
                    <div>
                      <b>{r.reason}</b>
                      <div className={styles.itemMeta}>
                        {event?.name ?? "Deleted event"} · {r.count} report{r.count === 1 ? "" : "s"} · {r.time}
                      </div>
                    </div>
                    <span className={`${styles.pill} ${r.state === "waiting" ? styles.pillWarn : ""}`}>
                      {r.state === "waiting" ? `Waiting for ${org?.org ?? "organizer"}` : r.state === "kept" ? "Kept" : "Removed"}
                    </span>
                    <span className={styles.chevron}>
                      <ChevronRightIcon />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {openReport && <ReportDetails reports={[openReport]} onClose={() => setOpenReport(null)} />}
    </>
  );
}
