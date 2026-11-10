"use client";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";

export default function ReportsPage() {
  const { reports, getEvent } = useStore();
  return (
    <>
      <h1>Reported photos</h1>
      {reports.length === 0 && <p className="empty">No reports. Reported photos will appear here.</p>}
      {reports.map((r) => {
        const e = getEvent(r.ev);
        const p = e.photos.find((x) => x.id === r.photo);
        return (
          <Link key={r.id} href={`/reports/${r.id}`} className="notif">
            <span className="th" style={{ background: p ? p.shade : "var(--chip)" }} />
            <span>
              <p className="t">A photo was reported</p>
              <p className="s">{r.reason}</p>
              <p className="s">{e.name} · {r.time}</p>
            </span>
            {r.state === "resolved" ? <span className="done">Resolved</span> : r.unread ? <span className="dot" aria-label="Unread" /> : null}
          </Link>
        );
      })}
    </>
  );
}
