"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import PageHead from "@/components/PageHead";
import { useStore } from "@/components/StoreProvider";

function PhotosChart({ hours }) {
  const max = Math.max(...hours.map((h) => h[1]));
  const W = 600, H = 200, bw = W / hours.length;
  return (
    <svg viewBox="0 0 600 224" width="100%" role="img" aria-label="Photos per hour">
      {hours.map(([label, n], i) => {
        const bh = (n / max) * (H - 24);
        const cx = i * bw + bw / 2;
        return (
          <g key={label}>
            <rect x={i * bw + bw * 0.18} y={H - bh} width={bw * 0.64} height={bh} rx="8" fill="var(--ink)" />
            <text x={cx} y={H - bh - 6} textAnchor="middle">{n}</text>
            <text x={cx} y="218" textAnchor="middle">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AnalyticsPage() {
  const { id } = useParams();
  const { getEvent, setCapacity, notify } = useStore();
  const e = getEvent(id);
  const [cap, setCap] = useState(e ? String(e.capacity) : "");
  if (!e) return <p className="empty">Event not found.</p>;

  const total = e.photos.length;
  const avg = e.participants ? (total / e.participants).toFixed(1) : "0";
  const pct = Math.min(100, Math.round((total / e.capacity) * 100));
  const save = () => {
    const v = parseInt(cap, 10);
    if (!v || v < 1) return notify("Enter a limit of 1 or more");
    setCapacity(e.id, v);
  };

  return (
    <>
      <PageHead event={e} title="Analytics" />
      <div className="stats">
        <div className="stat"><b>{total}</b><span>Photos</span></div>
        <div className="stat"><b>{e.participants}</b><span>Participants</span></div>
        <div className="stat"><b>{avg}</b><span>Photos per participant</span></div>
      </div>
      <div className="two">
      <section className="card">
        <h2>Photos over time</h2>
        {e.hours.length ? <PhotosChart hours={e.hours} /> : <p className="empty">Data will show once the event starts.</p>}
      </section>
      <section className="card">
        <h2>Photo capacity</h2>
        <p className="meta" style={{ marginBottom: 0 }}>
          {total} of {e.capacity} photos used ({pct}%). Guests can’t add photos once the limit is reached.
        </p>
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
        <div className="field">
          <input type="number" min="1" value={cap} onChange={(ev) => setCap(ev.target.value)} aria-label="Photo capacity" />
          <button className="btn pri" onClick={save}>Save limit</button>
        </div>
      </section>
      </div>
    </>
  );
}
