import Link from "next/link";
import styles from "./admin.module.css";

/**
 * The organizer gallery pages' top bar: "Event Gallery" with an Organizer tag
 * (linking back to the organizer's events), and optional actions on the right.
 */
export function AdminTopBar({ actions }: { actions?: React.ReactNode }) {
  return (
    <header className={styles.topBar}>
      <div className={`${styles.container} ${styles.topBarInner}`}>
        <Link href="/events" className={styles.brand}>
          Event Gallery <span className={styles.rolePill}>Organizer</span>
        </Link>
        {actions && <div className={styles.topActions}>{actions}</div>}
      </div>
    </header>
  );
}
