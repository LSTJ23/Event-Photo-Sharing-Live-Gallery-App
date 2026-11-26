"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { changePassword, requestCode, signIn, signOut, verifyCode } from "@/lib/auth";
import { useCurrentUser } from "@/components/useCurrentUser";

type View = "home" | "participant" | "management" | "password";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = useCurrentUser();
  const activeView = current.status === "ready" && current.user.mustChangePassword ? "password" : view;

  async function joinEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventId || eventId === "." || eventId === "..") {
      setError("This event link is invalid. Scan the event QR code again.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!codeSent) {
        await requestCode(email, eventId);
        setCodeSent(true);
      } else {
        await verifyCode(email, code, name, eventId);
        router.push(`/e/${encodeURIComponent(eventId)}/camera`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function openDashboard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await signIn(email, password);
      if (user.role !== role) {
        await signOut();
        setError("This account does not match the selected role.");
      } else if (user.mustChangePassword) {
        setPassword("");
        setView("password");
      } else {
        router.push(user.role === "admin" ? "/admin" : "/events");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await changePassword(password);
      router.push(user.role === "admin" ? "/admin" : "/events");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to change password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelPasswordChange() {
    setBusy(true);
    setError("");
    try {
      await signOut();
      setPassword("");
      setView("home");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to log out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="glass-container portal-theme">
      <div className="glass-card">
        {activeView !== "home" && activeView !== "password" && (
          <button type="button" className="close-btn" aria-label="Back to portal" onClick={() => { setError(""); setView("home"); }}>
            <span aria-hidden="true">×</span>
          </button>
        )}
        <div className="app-title stagger-1">Event Photo Sharing</div>
        {activeView === "home" ? (
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
        ) : activeView === "participant" ? (
          <>
            <h1 className="stagger-1">Join Gallery</h1>
            {eventId ? (
              <>
                <p className="stagger-1">{codeSent ? "Enter the verification code sent to your email." : "Enter your details to join the event."}</p>
                <form className="form-layout stagger-2" onSubmit={joinEvent}>
                  <div className="input-group">
                    <label htmlFor="login-name">Full Name</label>
                    <input type="text" id="login-name" className="input-field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} readOnly={codeSent} required />
                  </div>
                  <div className="input-group">
                    <label htmlFor="login-email">Email Address</label>
                    <input type="email" id="login-email" className="input-field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={codeSent} required />
                  </div>
                  {codeSent && (
                    <div className="input-group">
                      <label htmlFor="login-code">Verification Code</label>
                      <input type="text" id="login-code" className="input-field" autoComplete="one-time-code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} required />
                    </div>
                  )}
                  {error && <span className="form-error" role="alert">{error}</span>}
                  <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Please wait..." : codeSent ? "Enter Event" : "Send Verification Code"}</button>
                  {codeSent && <button type="button" className="text-link" onClick={() => { setCodeSent(false); setCode(""); setError(""); }}>Change details or resend code</button>}
                </form>
              </>
            ) : (
              <p>Open the event link or scan its QR code with your phone&apos;s camera to join.</p>
            )}
            <div className="text-center mt-4">
              <button type="button" className="text-link" onClick={() => { setError(""); setPassword(""); setView("management"); }}>
                Organizer or admin? Log in
              </button>
            </div>
          </>
        ) : activeView === "management" ? (
          <>
            <h1 className="stagger-1">Dashboard Access</h1>
            <p className="stagger-1">Choose your role to open the corresponding dashboard.</p>
            <form className="form-layout stagger-2" onSubmit={openDashboard}>
              <div className="input-group">
                <label htmlFor="admin-email">Email Address</label>
                <input type="email" id="admin-email" className="input-field" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <label htmlFor="admin-password">Password</label>
                <input type="password" id="admin-password" className="input-field" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
              {error && <span className="form-error" role="alert">{error}</span>}
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Signing in..." : "Login to Dashboard"}</button>
            </form>
          </>
        ) : (
          <>
            <h1 className="stagger-1">Change Password</h1>
            <p className="stagger-1">Set a new password before opening your dashboard.</p>
            <form className="form-layout stagger-2" onSubmit={updatePassword}>
              <div className="input-group">
                <label htmlFor="new-password">New Password</label>
                <input type="password" id="new-password" className="input-field" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <span className="form-error" role="alert">{error}</span>}
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Save Password"}</button>
              <button type="button" className="text-link" disabled={busy} onClick={cancelPasswordChange}>Log out</button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
