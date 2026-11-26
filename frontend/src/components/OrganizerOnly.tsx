"use client";

import Link from "next/link";
import type { Role } from "@/lib/auth";
import { useCurrentUser } from "./useCurrentUser";
import styles from "./admin.module.css";

function RoleGate({ allow, title, children }: { allow: Role[]; title: string; children: React.ReactNode }) {
  const state = useCurrentUser();
  if (state.status === "loading") return <main className={styles.page}><p>Checking your session...</p></main>;
  if (state.status === "error") return <main className={styles.page}><p role="alert">Unable to check your session. Please try again.</p></main>;
  if (state.status !== "ready" || state.user.mustChangePassword || !allow.includes(state.user.role)) {
    return (
      <main className={styles.page}>
        <div className={styles.statusMessage}>
          <h1>{title}</h1>
          <p className={styles.muted}>
            Sign in with an authorized account to continue.
          </p>
          <Link href="/portal">Go to login</Link>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}

/**
 * Shows its pages only to event organizers (and admins); anyone else sees a
 * short message. The backend must also refuse organizer actions from others.
 */
export function OrganizerOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={["organizer", "admin"]} title="This page is for event organizers">
      {children}
    </RoleGate>
  );
}

/** Shows its pages only to admins. The backend must also refuse admin actions from others. */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={["admin"]} title="This page is for admins">
      {children}
    </RoleGate>
  );
}
