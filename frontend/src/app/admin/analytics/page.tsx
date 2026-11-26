"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import { useAdminStore } from "@/components/admin/AdminStore";
import styles from "@/components/admin/dashboard.module.css";
import { formatWhen, topEvents, type AdminEvent } from "@/lib/adminData";

type SortKey = "date" | "participants" | "photoCount";

/**
 * Analytics. Whole app: totals, the top events by participants and by
 * pictures. Per event: participants and pictures uploaded, sorted by date (default),
 * most participants or most pictures (the dropdown or a column header).
 */
export default function AnalyticsPage() {
  const { events, getOrganizer } = useAdminStore();
  const participants = events.reduce((n, e) => n + e.participants, 0);
  const photos = events.reduce((n, e) => n + e.photoCount, 0);
  const byParticipants = topEvents(events, "participants");
  const byPhotos = topEvents(events, "photoCount");
  const [sort, setSort] = useState<SortKey>("date");
  const perEvent = [...events].sort((a, b) =>
    sort === "date" ? b.date.localeCompare(a.date) : b[sort] - a[sort] || b.date.localeCompare(a.date)
  );
  const header = (key: SortKey, label: string, num = false) => (
    <th scope="col" className={num ? styles.num : undefined} aria-sort={sort === key ? "descending" : "none"}>
      <button type="button" className={`${styles.sortButton} ${sort === key ? styles.sortActive : ""}`} onClick={() => setSort(key)}>
        {label}
        <span aria-hidden="true">{sort === key ? "▼" : ""}</span>
      </button>
    </th>
  );

  return (
    <>
      <PageHeader title="Analytics" />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Events</div>
          <div className={styles.statValue}>{events.length}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Participants</div>
          <div className={styles.statValue}>{participants}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Pictures uploaded</div>
          <div className={styles.statValue}>{photos}</div>
        </div>
      </div>

      <div className={styles.panels}>
        <TopList title="Top Events by Participants" unit="participants" field="participants" events={byParticipants} />
        <TopList title="Top Events by Pictures" unit="pictures" field="photoCount" events={byPhotos} />
      </div>

      <section className={styles.card} aria-labelledby="per-event-title">
        <div className={styles.cardHead}>
          <h2 id="per-event-title" className={styles.cardTitle}>
            Per Event
          </h2>
          <label className={styles.sortSelect}>
            <span>Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="date">Date (newest first)</option>
              <option value="participants">Most participants</option>
              <option value="photoCount">Most pictures</option>
            </select>
          </label>
        </div>
        {perEvent.length === 0 ? (
          <p className={styles.muted}>No events yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {header("date", "Event")}
                  <th scope="col" className={styles.colOrg}>
                    Organizer
                  </th>
                  {header("participants", "Participants", true)}
                  {header("photoCount", "Pictures", true)}
                </tr>
              </thead>
              <tbody>
                {perEvent.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/admin/events/${e.id}/gallery`} className={styles.tableLink}>
                        {e.name}
                      </Link>
                      <span className={styles.itemMeta} style={{ display: "block" }}>
                        {formatWhen(e.date, "")}
                        {e.archived ? " · Archived" : e.status === "ENDED" ? " · Ended" : e.status === "LIVE" ? " · Live" : ""}
                      </span>
                    </td>
                    <td className={styles.colOrg}>{getOrganizer(e.organizerId)?.org ?? "—"}</td>
                    <td className={styles.num}>{e.participants}</td>
                    <td className={styles.num}>
                      {e.photoCount}
                      <span className={styles.itemMeta}> / {e.capacity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

/** A ranked list of events with a bar for each, scaled to the top one. */
function TopList({
  title,
  unit,
  field,
  events
}: {
  title: string;
  unit: string;
  field: "participants" | "photoCount";
  events: AdminEvent[];
}) {
  const most = Math.max(1, ...events.map((e) => e[field]));
  const id = `${field}-title`;
  return (
    <section className={styles.card} aria-labelledby={id}>
      <div className={styles.cardHead}>
        <h2 id={id} className={styles.cardTitle}>
          {title}
        </h2>
      </div>
      {events.length === 0 ? (
        <p className={styles.muted}>No {unit} yet.</p>
      ) : (
        <ol className={styles.list}>
          {events.map((e, i) => (
            <li key={e.id} className={styles.barRow}>
              <div className={styles.barTop}>
                <span className={styles.ellipsis}>
                  <span className={`${styles.rank} ${i === 0 ? styles.rankFirst : ""}`} style={{ display: "inline-grid", marginRight: 10, width: 24, height: 24, fontSize: 12 }}>
                    {i + 1}
                  </span>
                  <Link href={`/admin/events/${e.id}/gallery`} className={styles.tableLink}>
                    {e.name}
                  </Link>
                </span>
                <span>
                  <b>{e[field]}</b> <span className={styles.muted}>{unit}</span>
                </span>
              </div>
              <div className={styles.barTrack} role="img" aria-label={`${e.name}: ${e[field]} ${unit}`}>
                <span style={{ width: `${(e[field] / most) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
