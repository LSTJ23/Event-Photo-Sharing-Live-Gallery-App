import Link from "next/link";
import { PageHeading } from "@/components/organizer/PageHeading";
import styles from "@/components/organizer.module.css";

// Placeholder until the login page (built separately) exists.
export default function LoggedOutPage() {
  return (
    <>
      <PageHeading title="Logged out" />
      <p className={styles.muted}>This is a prototype, so there&apos;s no login screen yet. Return to your events.</p>
      <Link href="/events" className={styles.btnDark} style={{ marginTop: "1.25rem" }}>
        Back to events
      </Link>
    </>
  );
}
