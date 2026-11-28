"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import { useAdminStore } from "@/components/admin/AdminStore";
import styles from "@/components/admin/dashboard.module.css";
import { eventGroup, formatWhen, summarize, topEvents, type AdminEvent, type EventGroup } from "@/lib/adminData";

type SortKey = "date" | "participants" | "photoCount";
type Filter = "all" | EventGroup;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All events" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "archived", label: "Archived" }
];

const GROUP_LABEL: Record<EventGroup, string> = { live: "Live", upcoming: "Upcoming", past: "Past", archived: "Archived" };

/**
 * Analytics for the whole app. Pick which events to look at (all, live,
 * upcoming, past or archived); the totals, the top events by participants and
 * by pictures, and the per-event table all follow that choice. The table sorts
 * by date (default), most participants or most pictures.
 */
export default function AnalyticsPage() {
  const { events: allEvents, getOrganizer } = useAdminStore();
  const [filter, setFilter] = useState<Filter>("all");
  const count = (f: Filter) => (f === "all" ? allEvents.length : allEvents.filter((e) => eventGroup(e) === f).length);
  const events = filter === "all" ? allEvents : allEvents.filter((e) => eventGroup(e) === filter);
  const total = summarize(events);
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

      <div className={styles.tabs} role="tablist" aria-label="Which events">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label} · {count(f.key)}
          </button>
        ))}
      </div>

      <div className={`${styles.stats} ${styles.stats4}`}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Events</div>
          <div className={styles.statValue}>{total.events}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Participants</div>
          <div className={styles.statValue}>{total.participants}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Pictures uploaded</div>
          <div className={styles.statValue}>{total.photos}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Pictures per event</div>
          <div className={styles.statValue}>{total.photosPerEvent}</div>
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
          <p className={styles.muted}>{filter === "all" ? "No events yet." : `No ${GROUP_LABEL[filter as EventGroup].toLowerCase()} events.`}</p>
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
                      <span className={`${styles.groupTag} ${styles[`group_${eventGroup(e)}`]}`}>{GROUP_LABEL[eventGroup(e)]}</span>
                      <span className={styles.itemMeta} style={{ display: "block" }}>
                        {formatWhen(e.date, "")}
                        
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
