"use client";
/* eslint-disable @next/next/no-img-element -- photo URLs can be blob: or any storage host */

import Link from "next/link";
import { useState } from "react";
import { AdminTopBar } from "@/components/AdminTopBar";
import { useEventSession } from "@/components/EventSession";
import { CheckIcon, ChevronLeftIcon, CopyIcon, DownloadIcon, LinkIcon, TrashIcon } from "@/components/icons";
import { downloadQrPng, QrCode } from "@/components/QrCode";
import { RemovePhotosModal } from "@/components/RemovePhotosModal";
import { ShareLinkModal, type CopyState } from "@/components/ShareLinkModal";
import { useOrigin } from "@/components/useOrigin";
import { usePhotos } from "@/components/usePhotos";
import styles from "@/components/admin.module.css";
import { removePhotos } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { formatEventDate } from "@/lib/format";
import { displayLink, shareLinkFor } from "@/lib/shareLink";

/** 09 Gallery Management (desktop), with 09b the remove confirmation. */
export default function ManageGalleryPage() {
  const { event } = useEventSession();
  const photos = usePhotos(event.id);
  const origin = useOrigin();
  const link = shareLinkFor(origin, event.id);
  const galleryHref = `/admin/e/${event.id}`;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toRemove, setToRemove] = useState<string[] | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeFailed, setRemoveFailed] = useState(false);
  const [copyDialog, setCopyDialog] = useState<CopyState | null>(null);

  const list = photos.status === "ready" ? photos.photos : [];
  const count = photos.status === "ready" ? list.length : null;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const askToRemove = (ids: string[]) => {
    setRemoveFailed(false);
    setToRemove(ids);
  };

  const confirmRemove = async () => {
    if (!toRemove) return;
    setRemoving(true);
    setRemoveFailed(false);
    try {
      await removePhotos(event.id, toRemove);
      setSelected((current) => {
        const next = new Set(current);
        toRemove.forEach((id) => next.delete(id));
        return next;
      });
      setToRemove(null);
      photos.refresh();
    } catch {
      setRemoveFailed(true);
    } finally {
      setRemoving(false);
    }
  };

  const copyLink = async () => setCopyDialog((await copyText(link)) ? "copied" : "failed");

  return (
    <main className={styles.page}>
      <AdminTopBar />

      <div className={styles.container}>
        <Link href={galleryHref} className={styles.backLink}>
          <ChevronLeftIcon /> Event Gallery
        </Link>
        <h1 className={styles.pageTitle}>Manage Gallery</h1>

        <div className={styles.manageLayout}>
          <section className={styles.manageInfo} aria-labelledby="gallery-info">
            <h2 id="gallery-info" className={styles.sectionLabel}>
              Gallery information
            </h2>
            <dl className={styles.infoList}>
              <div className={styles.infoRow}>
                <dt>Event</dt>
                <dd>{event.name}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>Date</dt>
                <dd>{formatEventDate(event.date)}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>Photos</dt>
                <dd>{count === null ? "…" : `${count} ${count === 1 ? "photo" : "photos"}`}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>Public link</dt>
                <dd>{event.shareLinkActive ? "Active" : "Off"}</dd>
              </div>
            </dl>

            <div className={styles.linkBlock}>
              <h2 className={styles.sectionLabel}>Public share link</h2>
              <div className={styles.linkField}>
                <span title={link}>{origin ? displayLink(link) : "…"}</span>
                <button
                  type="button"
                  className={styles.linkCopy}
                  onClick={copyLink}
                  disabled={!origin}
                  aria-label="Copy public share link"
                >
                  <CopyIcon />
                </button>
              </div>
              <button type="button" className={styles.btn} onClick={copyLink} disabled={!origin}>
                <LinkIcon /> Copy Public Share Link
              </button>

              {origin && (
                <div className={styles.qrRow}>
                  <QrCode value={link} size={112} className={styles.qrThumb} />
                  <div className={styles.qrRowText}>
                    <p className={styles.qrRowTitle}>Event QR code</p>
                    <p className={styles.muted}>Guests scan this to join. Print it or post it at the venue.</p>
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={() => downloadQrPng(link, `${event.id}-qr-code.png`)}
                    >
                      <DownloadIcon /> Download QR Code
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.backButton}>
              <Link href={galleryHref} className={`${styles.btnDark} ${styles.btnTall}`}>
                Back to Gallery
              </Link>
            </div>
          </section>

          <section aria-labelledby="manage-photos">
            <div className={styles.manageHeader}>
              <h2 id="manage-photos" className={styles.sectionLabel}>
                Manage photos
              </h2>
              {selected.size > 0 && (
                <div className={styles.selectionActions}>
                  <button type="button" className={styles.textButton} onClick={() => setSelected(new Set())}>
                    Clear
                  </button>
                  <button type="button" className={styles.btnDanger} onClick={() => askToRemove([...selected])}>
                    <TrashIcon size={15} /> Delete {selected.size} {selected.size === 1 ? "Photo" : "Photos"}
                  </button>
                </div>
              )}
            </div>

            {photos.status === "loading" && <p className={styles.muted}>Loading photos…</p>}
            {photos.status === "error" && <p className={styles.muted}>We couldn&apos;t load the photos.</p>}
            {photos.status === "ready" && list.length === 0 && <p className={styles.muted}>No photos in this gallery.</p>}

            {list.length > 0 && (
              <ul className={styles.manageGrid}>
                {list.map((photo) => {
                  const isSelected = selected.has(photo.id);
                  return (
                    <li key={photo.id} className={`${styles.tile} ${isSelected ? styles.tileSelected : ""}`}>
                      <button
                        type="button"
                        className={styles.selectTile}
                        aria-pressed={isSelected}
                        aria-label={`Select photo shared by ${photo.sharedBy}`}
                        onClick={() => toggle(photo.id)}
                      >
                        <img src={photo.url} alt="" loading="lazy" />
                      </button>
                      <span className={styles.selectBubble} aria-hidden="true">
                        <CheckIcon size={12} strokeWidth={3} />
                      </span>
                      <button
                        type="button"
                        className={styles.tileTrash}
                        aria-label={`Remove photo shared by ${photo.sharedBy}`}
                        title="Remove this photo"
                        onClick={() => askToRemove([photo.id])}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <p className={styles.manageHint}>
              {selected.size > 0
                ? `${selected.size} selected`
                : "Select photos to remove them from the gallery."}
            </p>
          </section>
        </div>
      </div>

      {toRemove && (
        <RemovePhotosModal
          count={toRemove.length}
          removing={removing}
          failed={removeFailed}
          onConfirm={confirmRemove}
          onClose={() => setToRemove(null)}
        />
      )}
      {copyDialog && (
        <ShareLinkModal link={link} eventId={event.id} initialState={copyDialog} onClose={() => setCopyDialog(null)} />
      )}
    </main>
  );
}
