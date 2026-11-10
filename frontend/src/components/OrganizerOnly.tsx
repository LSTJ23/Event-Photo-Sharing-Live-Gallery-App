"use client";

import { getCurrentUser } from "@/lib/currentUser";
import styles from "./admin.module.css";

/**
 * Shows its pages only to event organizers; anyone else sees a short message.
 * This keeps participants out of the organizer screens in the app, but the
 * backend must also refuse organizer actions from non-organizers.
 */
export function OrganizerOnly({ children }: { children: React.ReactNode }) {
  if (getCurrentUser().role !== "organizer") {
    return (
      <main className={styles.page}>
        <div className={styles.statusMessage}>
          <h1>This page is for event organizers</h1>
          <p className={styles.muted}>
            To share photos, open the event link from the organizer or scan the event&apos;s QR code.
          </p>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
