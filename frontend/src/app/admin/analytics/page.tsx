"use client";

import { useState } from "react";
import { ChevronRightIcon, CloseIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import { initials, PageHeader } from "@/components/admin/AdminShell";
import { useAdminStore } from "@/components/admin/AdminStore";
import styles from "@/components/admin/dashboard.module.css";
import { formatWhen, topOrganizers, type TopOrganizer } from "@/lib/adminData";

/** Analytics: the most active organizers, and how full each event's gallery is (bar = share of its photo capacity). */
export default function AnalyticsPage() {
  const { events, organizers } = useAdminStore();
  const [openOrg, setOpenOrg] = useState<TopOrganizer | null>(null);
  const top = topOrganizers(events, organizers);
  const totalPhotos = events.reduce((n, e) => n + e.photoCount, 0);
  const byPhotos = [...events].sort((a, b) => b.photoCount - a.photoCount);

  return (
    <>
      <PageHeader title="Analytics" />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Photos shared</div>
          <div className={styles.statValue}>{totalPhotos}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Organizers with events</div>
          <div className={styles.statValue}>{top.length}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Photos per event</div>
          <div className={styles.statValue}>{events.length ? Math.round(totalPhotos / events.length) : 0}</div>
        </div>
      </div>

      <div className={styles.panels}>
        <section className={styles.card} aria-labelledby="top-title">
          <div className={styles.cardHead}>
            <h2 id="top-title" className={styles.cardTitle}>
              Top Organizers
            </h2>
            <span className={styles.muted} style={{ fontSize: 13 }}>
              By photos shared
            </span>
          </div>
          {top.length === 0 ? (
            <p className={styles.muted}>No organizers have events yet.</p>
          ) : (
            <ol className={styles.list}>
              {top.map((t, i) => (
                <li key={t.organizer.id}>
                  <button type="button" className={styles.rowButton} onClick={() => setOpenOrg(t)}>
                    <span className={`${styles.rank} ${i === 0 ? styles.rankFirst : ""}`}>{i + 1}</span>
                    <div>
                      <b>{t.organizer.org}</b>
                      <div className={styles.itemMeta}>
                        {t.events} event{t.events === 1 ? "" : "s"} · {t.organizer.person}
                      </div>
                    </div>
                    <b>{t.photos}</b>
                    <span className={styles.muted} style={{ fontSize: 13 }}>
                      photos
                    </span>
                    <span className={styles.chevron}>
                      <ChevronRightIcon />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={styles.card} aria-labelledby="per-event-title">
          <div className={styles.cardHead}>
            <h2 id="per-event-title" className={styles.cardTitle}>
              Photos per Event
            </h2>
            <span className={styles.muted} style={{ fontSize: 13 }}>
              Shared / capacity
            </span>
          </div>
          {byPhotos.length === 0 ? (
            <p className={styles.muted}>No events yet.</p>
          ) : (
            <ul className={styles.list}>
              {byPhotos.map((e) => (
                <li key={e.id} className={styles.barRow}>
                  <div className={styles.barTop}>
                    <b className={styles.ellipsis}>{e.name}</b>
                    <span className={styles.muted}>
                      {e.photoCount} / {e.capacity}
                    </span>
                  </div>
                  <div className={styles.barTrack} role="img" aria-label={`${e.name}: ${e.photoCount} of ${e.capacity} photos`}>
                    <span style={{ width: `${Math.min(100, (e.photoCount / Math.max(1, e.capacity)) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {openOrg && <OrganizerDetails top={openOrg} onClose={() => setOpenOrg(null)} />}
    </>
  );
}

/** Popup: one organizer, their events and photo counts. */
function OrganizerDetails({ top, onClose }: { top: TopOrganizer; onClose: () => void }) {
  const { events, reports } = useAdminStore();
  const org = top.organizer;
  const theirs = events.filter((e) => e.organizerId === org.id);
  const waiting = reports.filter((r) => r.state === "waiting" && theirs.some((e) => e.id === r.eventId)).length;

  return (
    <Modal labelledBy="org-title" onClose={onClose} className={styles.detailDialog}>
      <div className={styles.detailHead}>
        <span className={`${styles.avatar} ${styles.avatarLarge}`} aria-hidden="true">
          {initials(org.org)}
        </span>
        <h2 id="org-title">
          {org.org}
          <div className={styles.itemMeta} style={{ fontWeight: 400 }}>
            {org.person} · {org.email}
          </div>
        </h2>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close" data-autofocus>
          <CloseIcon />
        </button>
      </div>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Events</div>
          <div className={styles.statValue}>{top.events}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Photos</div>
          <div className={styles.statValue}>{top.photos}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Reports waiting</div>
          <div className={styles.statValue}>{waiting}</div>
        </div>
      </div>
      <div>
        <h3 className={styles.subhead}>Their events</h3>
        <ul className={styles.entries}>
          {theirs.map((e) => (
            <li key={e.id}>
              <span>
                <b>{e.name}</b>
                <div className={styles.itemMeta}>{formatWhen(e.date, e.time, e.endDate, e.endTime)}</div>
              </span>
              <span className={styles.muted} style={{ whiteSpace: "nowrap" }}>
                {e.photoCount} / {e.capacity}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
