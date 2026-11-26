"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type View = "home" | "participant" | "management";

export default function AppPortal() {
  return (
    <Suspense fallback={<main className="glass-container portal-theme">Loading portal...</main>}>
      <PortalForm />
    </Suspense>
  );
}

function PortalForm() {
  const router = useRouter();
  const eventId = useSearchParams().get("event");
  const [view, setView] = useState<View>(eventId ? "participant" : "home");
  const [role, setRole] = useState<"organizer" | "admin">("organizer");
  const [error, setError] = useState("");

  function joinEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventId || eventId === "." || eventId === "..") {
      setError("This event link is invalid. Scan the event QR code again.");
      return;
    }
    router.push(`/e/${encodeURIComponent(eventId)}/camera`);
  }

  function openDashboard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(role === "admin" ? "/admin" : "/events");
  }

  return (
    <main className="glass-container portal-theme">
      <div className="glass-card">
        {view !== "home" && (
          <button type="button" className="close-btn" aria-label="Back to portal" onClick={() => setView("home")}>
            <span aria-hidden="true">×</span>
          </button>
        )}
        <div className="app-title stagger-1">Event Photo Sharing</div>
        {view === "home" ? (
          <>
            <h1 className="stagger-1">Event Portal</h1>
            <p className="stagger-2">Access the live event gallery and connect instantly.</p>
            <div className="stagger-3 button-group" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button
                type="button"
                onClick={() => setView("participant")}
                className="btn-primary"
              >
                Participant Access
              </button>
              <button
                type="button"
                onClick={() => setView("management")}
                className="btn-primary"
                style={{ backgroundColor: "#f5f5f5", color: "#000000", border: "1px solid #e0e0e0", boxShadow: "none" }}
              >
                Organizer &amp; Admin
              </button>
            </div>
          </>
        ) : view === "participant" ? (
          <>
            <h1 className="stagger-1">Join Gallery</h1>
            {eventId ? (
              <>
                <p className="stagger-1">Enter your details to join the event.</p>
                <form className="form-layout stagger-2" onSubmit={joinEvent}>
                  <div className="input-group">
                    <label htmlFor="login-name">Full Name</label>
                    <input type="text" id="login-name" className="input-field" autoComplete="name" required />
                  </div>
                  <div className="input-group">
                    <label htmlFor="login-email">Email Address</label>
                    <input type="email" id="login-email" className="input-field" autoComplete="email" required />
                  </div>
                  {error && <span role="alert">{error}</span>}
                  <button type="submit" className="btn-primary">Enter Event</button>
                </form>
              </>
            ) : (
              <p>Open the event link or scan its QR code with your phone&apos;s camera to join.</p>
            )}
            <div className="text-center mt-4">
              <button type="button" className="text-link" onClick={() => setView("management")}>
                Organizer or admin? Log in
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="stagger-1">Dashboard Access</h1>
            <p className="stagger-1">Choose your role to open the corresponding dashboard.</p>
            <form className="form-layout stagger-2" onSubmit={openDashboard}>
              <div className="input-group">
                <label htmlFor="admin-email">Email Address</label>
                <input type="email" id="admin-email" className="input-field" autoComplete="username" required />
              </div>
              <div className="input-group">
                <label htmlFor="admin-password">Password</label>
                <input type="password" id="admin-password" className="input-field" autoComplete="current-password" required />
              </div>
              <div className="input-group">
                <label htmlFor="management-role">Select Role</label>
                <select
                  id="management-role"
                  className="input-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value === "admin" ? "admin" : "organizer")}
                >
                  <option value="organizer">Event Organizer</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Login to Dashboard</button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
