"use client";

import { useState } from "react";
import styles from "../organizer.module.css";

/**
 * Photos shared per hour, as bars. One series: one colour, no legend (the
 * panel title names it). Only the busiest hour is labelled; hovering or
 * focusing a bar shows its count and dims the others. A hidden table gives
 * screen readers the same numbers.
 */
export function PhotosChart({ hours }: { hours: [string, number][] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...hours.map(([, n]) => n), 1);
  const peak = hours.findIndex(([, n]) => n === max);

  return (
    <>
      <div className={styles.chart} aria-hidden="true" onMouseLeave={() => setActive(null)}>
        {hours.map(([label, n], i) => (
          <div
            key={label}
            className={`${styles.chartColumn} ${active !== null && active !== i ? styles.chartDimmed : ""}`}
            onMouseEnter={() => setActive(i)}
            title={`${label}: ${n} ${n === 1 ? "photo" : "photos"}`}
          >
            <span className={styles.chartValue}>{active === i || (active === null && i === peak) ? n : ""}</span>
            <div className={styles.chartBar} style={{ height: `${(n / max) * 82}%` }} />
          </div>
        ))}
      </div>
      <div className={styles.chartLabels} aria-hidden="true">
        {hours.map(([label]) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <table className={styles.visuallyHidden}>
        <caption>Photos shared per hour</caption>
        <thead>
          <tr>
            <th scope="col">Hour</th>
            <th scope="col">Photos</th>
          </tr>
        </thead>
        <tbody>
          {hours.map(([label, n]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
