"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BackLink } from "@/components/PageHead";
import { useStore } from "@/components/StoreProvider";

export default function ReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getReport, getEvent, markRead, deletePhoto, keepReport } = useStore();
  const r = getReport(id);
  useEffect(() => { markRead(id); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) return <><BackLink href="/reports">Reports</BackLink><p className="empty">Report not found.</p></>;
  const e = getEvent(r.ev);
  const p = e.photos.find((x) => x.id === r.photo);

  return (
    <>
      <BackLink href="/reports">Reported photos</BackLink>
      <h1>Report details</h1>
      <div className="detail">
      <div className="big" style={{ background: p ? p.shade : "var(--chip)", color: "var(--muted)" }}>
        {!p && "Photo removed"}
      </div>
      <div>
      <dl className="kv">
        <dt>Reason</dt><dd>{r.reason}</dd>
        <dt>Reported by</dt><dd>{r.by}</dd>
        <dt>Event</dt><dd>{e.name}</dd>
        <dt>When</dt><dd>{r.time}</dd>
        <dt>Status</dt><dd>{r.state === "open" ? "Needs review" : "Resolved"}</dd>
      </dl>
      {r.state === "open" && (
        <div className="btns">
          <button className="btn dng" onClick={() => { deletePhoto(e.id, r.photo); router.push("/reports"); }}>Delete photo</button>
          <button className="btn" onClick={() => { keepReport(r.id); router.push("/reports"); }}>Keep photo</button>
        </div>
      )}
      </div>
      </div>
    </>
  );
}
