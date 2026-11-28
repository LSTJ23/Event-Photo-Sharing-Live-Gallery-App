"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DownloadPhotosButton } from "@/components/DownloadPhotosButton";
import { ShareLinkModal } from "@/components/ShareLinkModal";
import { useOrigin } from "@/components/useOrigin";
import { ArchiveIcon, CalendarIcon, RestoreIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { PageHeader } from "@/components/admin/AdminShell";
import { useFrom, useHere, withFrom } from "@/components/admin/useBackTo";
import { useAdminStore } from "@/components/admin/AdminStore";
import styles from "@/components/admin/dashboard.module.css";
import { eventTab, formatWhen, matches, type AdminEvent, type EventTab } from "@/lib/adminData";
import { shareLinkFor } from "@/lib/shareLink";

function StatusPill({ status }: { status: AdminEvent["status"] }) {
  if (status === "LIVE")
    return (
      <span className={`${styles.pill} ${styles.pillGood}`}>
        <span className={styles.dot} aria-hidden="true" /> Live
      </span>
    );
  return <span className={styles.pill}>{status === "UPCOMING" ? "Upcoming" : "Ended"}</span>;
}

/**
 * Every event as a card. Current events: Edit, Gallery, QR. Past and archived
 * events: Gallery, Download all photos, Archive or Restore, and Delete.
 */
export default function ManageEventsPage() {
  const { events, getOrganizer, notify, archiveEvent, restoreEvent, deleteEvent } = useAdminStore();
  const from = useFrom();
  const here = useHere();
  // Opened from another page (e.g. the dashboard): links keep that, so Back finds its way home.
  const to = (href: string) => (from ? withFrom(href, here) : href);
  const [tab, setTab] = useState<EventTab>("current");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<AdminEvent | null>(null);
  const [archiving, setArchiving] = useState<{ event: AdminEvent; restore: boolean } | null>(null);
  const [sharing, setSharing] = useState<AdminEvent | null>(null);
  const origin = useOrigin();
  const inTab = events.filter((e) => eventTab(e) === tab);
  const shown = inTab.filter((e) => matches(query, e.name, e.venue, e.hashtag, getOrganizer(e.organizerId)?.org));
  const count = (t: EventTab) => events.filter((e) => eventTab(e) === t).length;

  return (
    <>
      <PageHeader
        title="Manage Events"
        back={from}
        action={
          <Link href={withFrom("/admin/events/create", here)} className={styles.btnDark}>
            + Create event
          </Link>
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Which events">
          <button type="button" role="tab" aria-selected={tab === "current"} onClick={() => setTab("current")}>
            Current · {count("current")}
          </button>
          <button type="button" role="tab" aria-selected={tab === "past"} onClick={() => setTab("past")}>
            Past events · {count("past")}
          </button>
          <button type="button" role="tab" aria-selected={tab === "archived"} onClick={() => setTab("archived")}>
            Archived · {count("archived")}
          </button>
        </div>
        <label className={styles.search}>
          <SearchIcon />
          <input type="search" placeholder="Search events, venues or organizers" aria-label="Search events" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {shown.length === 0 ? (
        <p className={styles.empty}>
          {query
            ? "No events match your search."
            : tab === "past"
              ? "No past events yet. Events show up here once they end."
              : tab === "archived"
                ? "No archived events."
                : "No current events. Create one to get started."}
        </p>
      ) : (
        <div className={styles.grid} role="tabpanel">
          {shown.map((e) => {
            const org = getOrganizer(e.organizerId);
            return (
              <article key={e.id} className={`${styles.item} ${styles.itemClickable}`}>
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
                    <h2 className={styles.itemTitle}>
                      <Link href={to(`/admin/events/${e.id}/gallery`)} className={styles.cardLink}>
                        {e.name}
                      </Link>
                    </h2>
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
                  {tab === "current" ? (
                    <div className={styles.itemActions}>
                      <Link href={to(`/admin/events/${e.id}/edit`)} className={`${styles.btn} ${styles.small}`}>
                        Edit
                      </Link>
                      <Link href={to(`/admin/events/${e.id}/gallery`)} className={`${styles.btn} ${styles.small}`}>
                        Gallery
                      </Link>
                      <button type="button" className={`${styles.btn} ${styles.small}`} onClick={() => setSharing(e)} disabled={!origin}>
                        Share
                      </button>
                    </div>
                  ) : (
                    <div className={styles.pastActions}>
                      <Link href={to(`/admin/events/${e.id}/gallery`)} className={`${styles.btn} ${styles.small}`}>
                        Gallery
                      </Link>
                      <DownloadPhotosButton
                        eventId={e.id}
                        eventName={e.name}
                        label="Download photos"
                        className={`${styles.btn} ${styles.small}`}
                        onDone={notify}
                      />
                      {e.archived ? (
                        <button type="button" className={`${styles.btn} ${styles.small}`} onClick={() => setArchiving({ event: e, restore: true })}>
                          <RestoreIcon /> Restore
                        </button>
                      ) : (
                        <button type="button" className={`${styles.btn} ${styles.small}`} onClick={() => setArchiving({ event: e, restore: false })}>
                          <ArchiveIcon /> Archive
                        </button>
                      )}
                      <button type="button" className={`${styles.btn} ${styles.small} ${styles.btnDangerText}`} onClick={() => setDeleting(e)}>
                        <TrashIcon /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {sharing && origin && <ShareLinkModal link={shareLinkFor(origin, sharing.id)} eventId={sharing.id} onClose={() => setSharing(null)} />}
      {archiving && (
        <ConfirmDialog
          title={`${archiving.restore ? "Restore" : "Archive"} ${archiving.event.name}?`}
          text={
            archiving.restore
              ? "It moves back to Past events."
              : "It moves to the Archived tab. Its photos are kept, and you can restore it anytime."
          }
          confirmLabel={archiving.restore ? "Restore" : "Archive"}
          icon={archiving.restore ? <RestoreIcon size={20} /> : <ArchiveIcon size={20} />}
          onConfirm={() => {
            if (archiving.restore) restoreEvent(archiving.event.id);
            else archiveEvent(archiving.event.id);
            setArchiving(null);
          }}
          onClose={() => setArchiving(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          text="The event and all its photos will be deleted for everyone, including the organizer. Download the photos first if you want to keep them. This can't be undone."
          confirmLabel="Delete event"
          danger
          icon={<TrashIcon size={20} />}
          onConfirm={() => {
            deleteEvent(deleting.id);
            setDeleting(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
