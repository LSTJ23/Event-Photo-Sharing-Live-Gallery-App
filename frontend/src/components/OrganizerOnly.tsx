"use client";

import { getCurrentUser, type Role } from "@/lib/currentUser";
import styles from "./admin.module.css";

function RoleGate({ allow, title, children }: { allow: Role[]; title: string; children: React.ReactNode }) {
  if (!allow.includes(getCurrentUser().role)) {
    return (
      <main className={styles.page}>
        <div className={styles.statusMessage}>
          <h1>{title}</h1>
          <p className={styles.muted}>
            To share photos, open the event link from the organizer or scan the event&apos;s QR code.
          </p>
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
