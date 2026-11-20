"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./dashboard.module.css";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const pad = (n: number) => String(n).padStart(2, "0");

/** "18:30" → { hour: 6, minute: 30, pm: true } */
function split(value: string) {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return { hour: ((h + 11) % 12) + 1, minute: m, pm: h >= 12 };
}

const join = (hour: number, minute: number, pm: boolean) => `${pad((hour % 12) + (pm ? 12 : 0))}:${pad(minute)}`;

/**
 * A time box that opens a hour / minute / AM-PM picker, like the browser's
 * own, but the lists stop at the end instead of scrolling forever.
 * The value is "HH:MM", 24-hour.
 */
export function TimeField({
  id,
  label,
  value,
  invalid,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const parts = split(value);

  useEffect(() => {
    if (!open) return;
    // Show the chosen hour and minute in the middle of their columns.
    panelRef.current?.querySelectorAll<HTMLElement>("[aria-selected='true']").forEach((el) => {
      const list = el.parentElement;
      if (list) list.scrollTop = el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2;
    });
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Picking any part first fills in the rest (12:00 PM), so one click gives a valid time.
  const pick = (change: Partial<{ hour: number; minute: number; pm: boolean }>) => {
    const next = { hour: 12, minute: 0, pm: true, ...parts, ...change };
    onChange(join(next.hour, next.minute, next.pm));
  };

  const text = parts ? `${pad(parts.hour)}:${pad(parts.minute)} ${parts.pm ? "PM" : "AM"}` : "--:-- --";

  return (
    <span className={styles.timeField} ref={wrapRef}>
      <button
        id={id}
        type="button"
        className={`${styles.input} ${styles.timeButton} ${parts ? "" : styles.placeholder} ${invalid ? styles.inputInvalid : ""}`}
        aria-label={`${label}: ${parts ? text : "not set"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {text}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>
      {open && (
        <div className={styles.timePanel} ref={panelRef} role="dialog" aria-label={`Choose the ${label.toLowerCase()}`}>
          <div className={styles.timeColumn} role="listbox" aria-label="Hour">
            {HOURS.map((h) => (
              <button key={h} type="button" role="option" aria-selected={parts?.hour === h} onClick={() => pick({ hour: h })}>
                {pad(h)}
              </button>
            ))}
          </div>
          <div className={styles.timeColumn} role="listbox" aria-label="Minutes">
            {MINUTES.map((m) => (
              <button key={m} type="button" role="option" aria-selected={parts?.minute === m} onClick={() => pick({ minute: m })}>
                {pad(m)}
              </button>
            ))}
          </div>
          <div className={styles.timeColumn} role="listbox" aria-label="AM or PM">
            <button type="button" role="option" aria-selected={parts ? !parts.pm : false} onClick={() => pick({ pm: false })}>
              AM
            </button>
            <button type="button" role="option" aria-selected={parts ? parts.pm : false} onClick={() => pick({ pm: true })}>
              PM
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
