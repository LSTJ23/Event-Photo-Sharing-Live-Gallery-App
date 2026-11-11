"use client";

import { useState } from "react";

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export type DateTimeValue = { date: Date; time: string };

type Props = {
  value: DateTimeValue;
  onChange: (v: DateTimeValue) => void;
};

export default function Calendar({ value, onChange }: Props) {
  const [view, setView] = useState(
    () => new Date(value.date.getFullYear(), value.date.getMonth(), 1)
  );

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const same = (a: Date, y: number, m: number, d: number) =>
    a.getFullYear() === y && a.getMonth() === m && a.getDate() === d;

  const label = view.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="calendar">
      <div className="cal-head">
        <strong>{label}</strong>
        <span>
          <button type="button" aria-label="Previous month" onClick={() => setView(new Date(year, month - 1, 1))}>
            ‹
          </button>
          <button type="button" aria-label="Next month" onClick={() => setView(new Date(year, month + 1, 1))}>
            ›
          </button>
        </span>
      </div>
      <div className="cal-grid">
        {DOW.map((d) => (
          <span key={d} className="dow">{d}</span>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <span key={`b${i}`} />
          ) : (
            <button
              type="button"
              key={d}
              className={[
                same(today, year, month, d) ? "today" : "",
                same(value.date, year, month, d) ? "selected" : "",
              ].join(" ")}
              aria-pressed={same(value.date, year, month, d)}
              onClick={() => onChange({ ...value, date: new Date(year, month, d) })}
            >
              {d}
            </button>
          )
        )}
      </div>
      <div className="cal-time">
        <label htmlFor="event-time">Time</label>
        <input
          id="event-time"
          type="time"
          value={value.time}
          onChange={(e) => onChange({ ...value, time: e.target.value })}
        />
      </div>
    </div>
  );
}
