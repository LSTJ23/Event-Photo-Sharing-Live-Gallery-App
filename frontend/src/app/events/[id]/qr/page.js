"use client";
import { useParams } from "next/navigation";
import PageHead from "@/components/PageHead";
import { useStore } from "@/components/StoreProvider";

// The QR code is created by the backend. Each event should arrive with:
//   joinUrl      - the link guests open
//   qrImageUrl   - URL of the QR code image (shown below as-is)
export default function QrPage() {
  const { id } = useParams();
  const { getEvent, notify } = useStore();
  const e = getEvent(id);
  if (!e) return <p className="empty">Event not found.</p>;

  const copy = async () => {
    try { await navigator.clipboard.writeText(e.joinUrl); notify("Link copied"); }
    catch { notify("Copy the link manually"); }
  };

  return (
    <>
      <PageHead event={e} title="QR code" />
      <div className="qr">
        {e.qrImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.qrImageUrl} alt={`QR code for ${e.name}`} width="220" height="220" />
        ) : (
          <div className="qrph">QR code here</div>
        )}
      </div>
      <div className="link">{e.joinUrl || "Link not available yet"}</div>
      <div className="btns"><button className="btn pri" onClick={copy} disabled={!e.joinUrl}>Copy link</button></div>
    </>
  );
}
