import Link from "next/link";
export default function Login() {
  return (
    <>
      <h1>Logged out</h1>
      <p className="sub">This is a prototype, so there is no login screen yet. Return to your events.</p>
      <Link href="/events" className="btn pri" style={{ display: "inline-grid", placeItems: "center" }}>Back to events</Link>
    </>
  );
}
