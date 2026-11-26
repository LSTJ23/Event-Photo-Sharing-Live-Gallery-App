"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/admin/AdminShell";
import { useBackTo, useHere, withFrom } from "@/components/admin/useBackTo";
import { useAdminStore } from "@/components/admin/AdminStore";
import { CheckIcon, PresentIcon, TrashIcon } from "@/components/icons";
import { RemovePhotosModal } from "@/components/RemovePhotosModal";
import { ShareLinkModal } from "@/components/ShareLinkModal";
import { useOrigin } from "@/components/useOrigin";
import { usePhotos } from "@/components/usePhotos";
import styles from "@/components/admin/dashboard.module.css";
import { formatWhen } from "@/lib/adminData";
import { removePhotos } from "@/lib/api";
import { shareLinkFor } from "@/lib/shareLink";

/**
 * An event's photos, seen from the admin dashboard. Admins can open the
 * Display gallery (present mode), share the link, and select photos to delete.
 * Back goes to where you came from (?from=), otherwise Manage Events.
 */
export default function AdminGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const { getEvent, getOrganizer, notify } = useAdminStore();
  const origin = useOrigin();
  const photos = usePhotos(id);
  const [sharing, setSharing] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [failed, setFailed] = useState(false);
  const event = getEvent(id);
  const back = useBackTo("/admin/events");
  const here = useHere();

  if (!event) return <PageHeader title="Event not found" back={back} subtitle="It may have been deleted, or the link is wrong." />;

  const org = getOrganizer(event.organizerId);
  const list = photos.status === "ready" ? photos.photos : [];

  const toggle = (photoId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });

  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const remove = async () => {
    setRemoving(true);
    setFailed(false);
    try {
      // TODO (backend): the server must allow admins to delete any event's photos.
      await removePhotos(event.id, [...selected]);
      const n = selected.size;
      photos.refresh();
      setConfirming(false);
      stopSelecting();
      notify(`Deleted ${n} ${n === 1 ? "photo" : "photos"}`);
    } catch {
      setFailed(true);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={event.name}
        back={back}
        subtitle={`${formatWhen(event.date, event.time, event.endDate, event.endTime)} · ${event.venue}${org ? ` · ${org.org}` : ""}`}
      />

      <div className={styles.galleryActions}>
        <Link href={`/display/${event.id}?back=${encodeURIComponent(here)}`} className={`${styles.btnDark} ${styles.displayButton}`}>
          <PresentIcon /> Display gallery
        </Link>
        <Link href={withFrom(`/admin/events/${event.id}/qr`, here)} className={styles.btn}>
          QR code
        </Link>
        <button type="button" className={styles.btn} onClick={() => setSharing(true)} disabled={!origin}>
          Share link
        </button>
      </div>

      <section className={styles.card} aria-labelledby="photos-title">
        <div className={styles.cardHead}>
          <h2 id="photos-title" className={styles.cardTitle}>
            Photos{photos.status === "ready" ? ` · ${list.length}` : ""}
          </h2>
          {list.length > 0 &&
            (selecting ? (
              <button type="button" className={`${styles.btn} ${styles.small}`} onClick={stopSelecting}>
                Cancel
              </button>
            ) : (
              <button type="button" className={`${styles.btn} ${styles.small}`} onClick={() => setSelecting(true)}>
                Select photos
              </button>
            ))}
        </div>

        {selecting && (
          <div className={styles.selectBar} role="status">
            <span>{selected.size === 0 ? "Tap photos to select them" : `${selected.size} selected`}</span>
            <button
              type="button"
              className={`${styles.btn} ${styles.small}`}
              onClick={() => setSelected(selected.size === list.length ? new Set() : new Set(list.map((p) => p.id)))}
            >
              {selected.size === list.length ? "Clear" : "Select all"}
            </button>
            <button
              type="button"
              className={`${styles.btnDanger} ${styles.small}`}
              disabled={selected.size === 0}
              onClick={() => {
                setFailed(false);
                setConfirming(true);
              }}
            >
              <TrashIcon /> Delete{selected.size ? ` ${selected.size}` : ""}
            </button>
          </div>
        )}

        {photos.status === "loading" && <p className={styles.muted}>Loading photos…</p>}
        {photos.status === "error" && <p className={styles.muted}>Couldn&apos;t load the photos. Try again in a moment.</p>}
        {photos.status === "ready" &&
          (list.length === 0 ? (
            <p className={styles.muted}>No photos have been shared yet.</p>
          ) : (
            <div className={styles.photoGrid}>
              {list.map((p) => {
                const isSelected = selected.has(p.id);
                const photo = (
                  <>
                    <img src={p.url} alt={`Photo shared by ${p.sharedBy}`} loading="lazy" />
                    <figcaption>Shared by {p.sharedBy}</figcaption>
                  </>
                );
                return selecting ? (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.photo} ${styles.photoSelectable} ${isSelected ? styles.photoSelected : ""}`}
                    aria-pressed={isSelected}
                    aria-label={`Photo shared by ${p.sharedBy}`}
                    onClick={() => toggle(p.id)}
                  >
                    <span className={styles.photoCheck} aria-hidden="true">
                      {isSelected && <CheckIcon size={14} />}
                    </span>
                    {photo}
                  </button>
                ) : (
                  <figure key={p.id} className={styles.photo}>
                    {photo}
                  </figure>
                );
              })}
            </div>
          ))}
      </section>

      {confirming && (
        <RemovePhotosModal count={selected.size} removing={removing} failed={failed} onConfirm={remove} onClose={() => setConfirming(false)} />
      )}
      {sharing && origin && <ShareLinkModal link={shareLinkFor(origin, event.id)} eventId={event.id} onClose={() => setSharing(false)} />}
    </>
  );
}
