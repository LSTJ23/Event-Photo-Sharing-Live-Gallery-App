"use client";

import styles from "./admin.module.css";
import { Modal } from "./Modal";

/**
 * "Are you sure?" for actions like archiving or deleting an event. Used by
 * both the admin and the organizer pages.
 */
export function ConfirmDialog({
  title,
  text,
  confirmLabel,
  danger = false,
  icon,
  onConfirm,
  onClose
}: {
  title: string;
  text: string;
  confirmLabel: string;
  /** Red confirm button, for things that can't be undone. */
  danger?: boolean;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal labelledBy="confirm-title" onClose={onClose}>
      {icon && (
        <span className={styles.dialogIcon} aria-hidden="true">
          {icon}
        </span>
      )}
      <h2 id="confirm-title" className={styles.dialogTitle}>
        {title}
      </h2>
      <p className={styles.dialogText}>{text}</p>
      <div className={`${styles.dialogActions} ${styles.dialogActionsRow}`}>
        <button type="button" className={styles.btn} onClick={onClose} data-autofocus>
          Cancel
        </button>
        <button type="button" className={danger ? styles.btnDanger : styles.btnDark} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
