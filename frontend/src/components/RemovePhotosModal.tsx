"use client";

import styles from "./admin.module.css";
import { TrashIcon } from "./icons";
import { Modal } from "./Modal";

/** 09b Remove photo(s) confirmation. */
export function RemovePhotosModal({
  count,
  removing,
  failed,
  onConfirm,
  onClose
}: {
  count: number;
  removing: boolean;
  failed: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const one = count === 1;
  return (
    <Modal labelledBy="remove-title" onClose={removing ? () => {} : onClose}>
      <span className={styles.dialogIcon} aria-hidden="true">
        <TrashIcon size={20} />
      </span>
      <h2 id="remove-title" className={styles.dialogTitle}>
        {one ? "Remove this photo?" : `Remove ${count} photos?`}
      </h2>
      <p className={styles.dialogText}>
        {one ? "It" : "They"} will be removed from the event gallery for everyone. This can&apos;t be undone.
      </p>
      {failed && (
        <p className={styles.dialogError} role="alert">
          Couldn&apos;t remove {one ? "the photo" : "the photos"}. Check your connection and try again.
        </p>
      )}
      <div className={`${styles.dialogActions} ${styles.dialogActionsRow}`}>
        <button type="button" className={styles.btn} onClick={onClose} disabled={removing} data-autofocus>
          Cancel
        </button>
        <button type="button" className={styles.btnDark} onClick={onConfirm} disabled={removing}>
          {removing ? "Removing…" : failed ? "Try Again" : "Remove"}
        </button>
      </div>
    </Modal>
  );
}
