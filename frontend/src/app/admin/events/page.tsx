"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarIcon, SearchIcon } from "@/components/icons";
import { PageHeader } from "@/components/admin/AdminShell";
import { useAdminStore } from "@/components/admin/AdminStore";
import styles from "@/components/admin/dashboard.module.css";
import { formatWhen, isPast, matches, type AdminEvent } from "@/lib/adminData";

type Tab = "current" | "past";

function StatusPill({ status }: { status: AdminEvent["status"] }) {
  if (status === "LIVE")
    return (
      <span className={`${styles.pill} ${styles.pillGood}`}>
        <span className={styles.dot} aria-hidden="true" /> Live
      </span>
    );
  return <span className={styles.pill}>{status === "UPCOMING" ? "Upcoming" : "Ended"}</span>;
}

/** Every event as a card, with Edit, Gallery and QR. Current and past events are on separate tabs. */
export default function ManageEventsPage() {
  const { events, getOrganizer } = useAdminStore();
  const [tab, setTab] = useState<Tab>("current");
  const [query, setQuery] = useState("");
  const inTab = events.filter((e) => (tab === "past" ? isPast(e) : !isPast(e)));
  const shown = inTab.filter((e) => matches(query, e.name, e.venue, e.hashtag, getOrganizer(e.organizerId)?.org));
  const counts = { current: events.filter((e) => !isPast(e)).length, past: events.filter(isPast).length };

  return (
    <>
      <PageHeader
        title="Manage Events"
        action={
          <Link href="/admin/events/create" className={styles.btnDark}>
            + Create event
          </Link>
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Which events">
          <button type="button" role="tab" aria-selected={tab === "current"} onClick={() => setTab("current")}>
            Current · {counts.current}
          </button>
          <button type="button" role="tab" aria-selected={tab === "past"} onClick={() => setTab("past")}>
            Past events · {counts.past}
          </button>
        </div>
        <label className={styles.search}>
          <SearchIcon />
          <input type="search" placeholder="Search events, venues or organizers" aria-label="Search events" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {shown.length === 0 ? (
        <p className={styles.empty}>
          {query ? "No events match your search." : tab === "past" ? "No past events yet." : "No current events. Create one to get started."}
        </p>
      ) : (
        <div className={styles.grid} role="tabpanel">
          {shown.map((e) => {
            const org = getOrganizer(e.organizerId);
            return (
              <article key={e.id} className={styles.item}>
                {e.covers.length > 0 ? (
                  <div className={styles.cover} aria-hidden="true">
                    {e.covers.map((c, i) => (
                      <span key={i} style={{ background: c }} />
                    ))}
                  </div>
                ) : (
                  <div className={styles.coverEmpty} aria-hidden="true">
                    <CalendarIcon />
                  </div>
                )}
                <div className={styles.itemBody}>
                  <div className={styles.itemTop}>
                    <h2 className={styles.itemTitle}>{e.name}</h2>
                    <StatusPill status={e.status} />
                  </div>
                  <span className={styles.itemMeta}>
                    {formatWhen(e.date, e.time, e.endDate, e.endTime)}
                    <br />
                    {e.venue}
                    {e.hashtag && ` · #${e.hashtag}`}
                    <br />
                    {org ? `${org.org} · ` : ""}
                    {e.photoCount} / {e.capacity} photos
                  </span>
                  <div className={styles.itemActions}>
                    <Link href={`/admin/events/${e.id}/edit`} className={`${styles.btn} ${styles.small}`}>
                      Edit
                    </Link>
                    <Link href={`/admin/events/${e.id}/gallery`} className={`${styles.btn} ${styles.small}`}>
                      Gallery
                    </Link>
                    <Link href={`/admin/events/${e.id}/qr`} className={`${styles.btn} ${styles.small}`}>
                      QR
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
