"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import { ReportDetails } from "@/components/admin/ReportDetails";
import { useFrom } from "@/components/admin/useBackTo";
import { useAdminStore } from "@/components/admin/AdminStore";
import { useReportPhotos } from "@/components/useReportPhotos";
import { HiddenBadge, ReportFlag } from "@/components/ReportMarkers";
import styles from "@/components/admin/dashboard.module.css";
import { reportStats, type AdminReport } from "@/lib/adminData";

/**
 * Report logs: how many reported photos are waiting, kept or removed, and the
 * reported photos themselves (Waiting first). Click one for the details.
 * Reported photos are view-only: only the event's organizer can keep or remove them.
 */
type Filter = "waiting" | "kept" | "removed" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "waiting", label: "Waiting" },
  { key: "kept", label: "Kept" },
  { key: "removed", label: "Removed" },
  { key: "all", label: "All" }
];

export default function ReportLogsPage() {
  const { reports, getEvent, getOrganizer } = useAdminStore();
  const from = useFrom();
  const [openReport, setOpenReport] = useState<AdminReport | null>(null);
  const [filter, setFilter] = useState<Filter>("waiting");
  const stats = reportStats(reports);
  const { photos } = useReportPhotos(reports);
  const count = (f: Filter) => (f === "all" ? reports.length : reports.filter((r) => r.state === f).length);
  const shown = filter === "all" ? reports : reports.filter((r) => r.state === filter);

  return (
    <>
      <PageHeader title="Report Logs" back={from} />

      <div className={`${styles.stats} ${styles.stats4}`}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Waiting for organizer</div>
          <div className={styles.statValue}>{stats.waiting}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Kept</div>
          <div className={styles.statValue}>{stats.kept}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Removed</div>
          <div className={styles.statValue}>{stats.removed}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Reports in total</div>
          <div className={styles.statValue}>{stats.totalReports}</div>
        </div>
      </div>

      <section className={styles.card} aria-labelledby="reported-title">
        <div className={styles.cardHead}>
          <h2 id="reported-title" className={styles.cardTitle}>
            Reported Photos
          </h2>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Which reports">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label} · {count(f.key)}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className={styles.muted} style={{ marginTop: 16 }}>
            {filter === "waiting" ? "Nothing waiting. Every reported photo has been handled." : "No reports here."}
          </p>
        ) : (
          <ul className={styles.reportGrid}>
            {shown.map((r) => {
              const event = getEvent(r.eventId);
              const org = event ? getOrganizer(event.organizerId) : undefined;
              const photo = r.photoId ? photos[r.photoId] : undefined;
              const url = photo?.url;
              return (
                <li key={r.id}>
                  <button type="button" className={styles.reportCard} onClick={() => setOpenReport(r)}>
                    <span className={styles.reportThumb} style={url ? undefined : { background: r.shade }}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- photo URLs can be blob: or any storage host */}
                      {url && <img src={url} alt="" loading="lazy" />}
                      <ReportFlag count={r.count} />
                      <HiddenBadge hidden={photo?.hidden} />
                    </span>
                    <span className={styles.reportCardBody}>
                      <b>{r.reason}</b>
                      <span className={styles.itemMeta}>
                        {event?.name ?? "Deleted event"} · {r.time}
                      </span>
                      <span
                        className={`${styles.pill} ${r.state === "waiting" ? styles.pillWarn : r.state === "kept" ? styles.pillGood : styles.pillBad}`}
                      >
                        {r.state === "waiting" ? `Waiting for ${org?.org ?? "organizer"}` : r.state === "kept" ? "Kept" : "Removed"}
                      </span>
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
