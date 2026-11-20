"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import styles from "./dashboard.module.css";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/**
 * A month calendar for picking when an event runs (dates are yyyy-mm-dd).
 * The first click picks the start (a one-day event); clicking a later day
 * then sets the end. Clicking again after that starts over. Clicking the
 * month and year switches to a month picker, to jump to another month or year.
 */
export function Calendar({
  start,
  end,
  onChange,
  invalid,
  labelledBy
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  invalid?: boolean;
  labelledBy?: string;
}) {
  const today = new Date();
  const first = start ? new Date(`${start}T00:00`) : today;
  const [month, setMonth] = useState({ y: first.getFullYear(), m: first.getMonth() });
  const [picking, setPicking] = useState(false);

  const lead = new Date(month.y, month.m, 1).getDay();
  const days = new Date(month.y, month.m + 1, 0).getDate();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());
  const title = new Date(month.y, month.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const move = (step: number) => {
    if (picking) {
      setMonth({ y: month.y + step, m: month.m });
      return;
    }
    const d = new Date(month.y, month.m + step, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
  };

  const pick = (key: string) => {
    const choosingEnd = start && (!end || end === start) && key > start;
    if (choosingEnd) onChange(start, key);
    else onChange(key, key);
  };

  return (
    <div className={`${styles.calendar} ${invalid ? styles.calendarInvalid : ""}`} role="group" aria-labelledby={labelledBy}>
      <div className={styles.calHead}>
        <button
          type="button"
          className={styles.calTitle}
          aria-expanded={picking}
          aria-live="polite"
          aria-label={picking ? `${month.y}, choose a month` : `${title}, choose another month or year`}
          onClick={() => setPicking((v) => !v)}
        >
          {picking ? month.y : title}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <span className={styles.calNav}>
          <button type="button" onClick={() => move(-1)} aria-label={picking ? "Previous year" : "Previous month"}>
            <ChevronLeftIcon />
          </button>
          <button type="button" onClick={() => move(1)} aria-label={picking ? "Next year" : "Next month"}>
            <ChevronRightIcon />
          </button>
        </span>
      </div>
      {picking ? (
        <div className={styles.monthGrid}>
          {MONTHS.map((name, m) => {
            const current = m === month.m;
            const thisMonth = m === today.getMonth() && month.y === today.getFullYear();
            return (
              <button
                key={name}
                type="button"
                className={`${styles.monthButton} ${current ? styles.calSelected : ""} ${thisMonth ? styles.calToday : ""}`}
                aria-pressed={current}
                aria-label={new Date(month.y, m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                onClick={() => {
                  setMonth({ y: month.y, m });
                  setPicking(false);
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      ) : (
      <div className={styles.calGrid}>
        {DOW.map((d) => (
          <span key={d} className={styles.calDow} aria-hidden="true">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const key = toKey(month.y, month.m, day);
          const isEdge = key === start || key === end;
          const between = !!start && !!end && key > start && key < end;
          const label = new Date(month.y, month.m, day).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
          });
          return (
            <span key={key} className={between || (isEdge && start !== end) ? rangeClass(key, start, end) : undefined}>
              <button
                type="button"
                className={`${styles.calDay} ${key === todayKey ? styles.calToday : ""} ${isEdge ? styles.calSelected : ""}`}
                aria-pressed={isEdge || between}
                aria-label={`${label}${key === start ? ", start" : ""}${key === end && end !== start ? ", end" : ""}`}
                onClick={() => pick(key)}
              >
                {day}
              </button>
            </span>
          );
        })}
      </div>
      )}
    </div>
  );
}

/** Shades the days an event spans, with rounded ends on the start and end days. */
function rangeClass(key: string, start: string, end: string) {
  if (key === start) return `${styles.calRange} ${styles.calRangeStart}`;
  if (key === end) return `${styles.calRange} ${styles.calRangeEnd}`;
  return styles.calRange;
}
