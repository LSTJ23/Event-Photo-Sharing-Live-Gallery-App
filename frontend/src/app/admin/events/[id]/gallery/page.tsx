"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import { useAdminStore } from "@/components/admin/AdminStore";
import { ShareLinkModal } from "@/components/ShareLinkModal";
import { useOrigin } from "@/components/useOrigin";
import { usePhotos } from "@/components/usePhotos";
import styles from "@/components/admin/dashboard.module.css";
import { formatWhen } from "@/lib/adminData";
import { shareLinkFor } from "@/lib/shareLink";

/**
 * An event's photos, seen from the admin dashboard (view-only). Back goes to
 * Manage Events, not the organizer pages.
 */
export default function AdminGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const { getEvent, getOrganizer } = useAdminStore();
  const origin = useOrigin();
  const photos = usePhotos(id);
  const [sharing, setSharing] = useState(false);
  const event = getEvent(id);

  if (!event) return <PageHeader title="Event not found" back="/admin/events" subtitle="It may have been deleted, or the link is wrong." />;

  const org = getOrganizer(event.organizerId);
  const count = photos.status === "ready" ? photos.photos.length : null;

  return (
    <>
      <PageHeader
        title={event.name}
        back="/admin/events"
        subtitle={`${formatWhen(event.date, event.time, event.endDate, event.endTime)} · ${event.venue}${org ? ` · ${org.org}` : ""}`}
        action={
          <div className={styles.headerButtons}>
            <Link href={`/admin/events/${event.id}/qr?from=gallery`} className={styles.btn}>
              QR code
            </Link>
            <button type="button" className={styles.btnDark} onClick={() => setSharing(true)}>
              Share link
            </button>
          </div>
        }
      />

      <section className={styles.card} aria-labelledby="photos-title">
        <div className={styles.cardHead}>
          <h2 id="photos-title" className={styles.cardTitle}>
            Photos{count !== null ? ` · ${count}` : ""}
          </h2>
        </div>
        {photos.status === "loading" && <p className={styles.muted}>Loading photos…</p>}
        {photos.status === "error" && <p className={styles.muted}>Couldn&apos;t load the photos. Try again in a moment.</p>}
        {photos.status === "ready" &&
          (photos.photos.length === 0 ? (
            <p className={styles.muted}>No photos have been shared yet.</p>
          ) : (
            <div className={styles.photoGrid}>
              {photos.photos.map((p) => (
                <figure key={p.id} className={styles.photo}>
                  <img src={p.url} alt={`Photo shared by ${p.sharedBy}`} loading="lazy" />
                  <figcaption>Shared by {p.sharedBy}</figcaption>
                </figure>
              ))}
            </div>
          ))}
      </section>

      {sharing && origin && <ShareLinkModal link={shareLinkFor(origin, event.id)} eventId={event.id} onClose={() => setSharing(false)} />}
    </>
  );
}
