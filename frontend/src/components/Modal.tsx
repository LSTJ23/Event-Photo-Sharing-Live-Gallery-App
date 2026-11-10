"use client";

import { useEffect, useRef } from "react";
import styles from "./admin.module.css";

interface ModalProps {
  /** id of the element that names the dialog (its title). */
  labelledBy: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A centred dialog over a dimmed page. Escape or a click on the dimmed area
 * closes it. Focus moves to the element marked `data-autofocus` (or the dialog)
 * and returns to whatever was focused before when it closes.
 */
export function Modal({ labelledBy, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Always call the latest onClose, without re-running the setup below when
  // the page around the dialog re-renders (e.g. the gallery refreshing).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const target = dialog?.querySelector<HTMLElement>("[data-autofocus]") ?? dialog;
    target?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
