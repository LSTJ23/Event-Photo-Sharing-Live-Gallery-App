"use client";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";

export default function EventsPage() {
  const { events, pendingCount } = useStore();
  return (
    <>
      <h1>Events</h1>
      <div className="evgrid">
      {events.map((e) => {
        const n = pendingCount(e.id);
        return (
          <section className="card" key={e.id}>
            <div className="row">
              <div>
                <h3>{e.name}</h3>
                <p className="meta">{e.when} · {e.venue}</p>
              </div>
              <span className={`pill ${e.status === "LIVE" ? "live" : "upcoming"}`}>{e.status}</span>
            </div>
            <div className="tiles">
              <button type="button" className="tile"><Icon name="img" />Gallery</button>
              <Link className="tile" href={`/events/${e.id}/analytics`}><Icon name="chart" />Analytics</Link>
              <Link className="tile" href={`/events/${e.id}/qr`}><Icon name="qr" />QR code</Link>
            </div>
            {n > 0 && (
              <Link href="/reports" className="flagbar">
                <span><Icon name="flag" fill />{n} reported {n === 1 ? "photo" : "photos"}</span>
                <b>Review</b>
              </Link>
            )}
          </section>
        );
      })}
      </div>
    </>
  );
}
