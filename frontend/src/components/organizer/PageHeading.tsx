import Link from "next/link";
import { ChevronLeftIcon } from "../icons";
import styles from "../organizer.module.css";

/**
 * Page title with an optional round back button beside it (same as the admin
 * dashboard), a line under it (e.g. the event's date and venue), a small count
 * beside the title, and an optional button on the right.
 */
export function PageHeading({
  title,
  subtitle,
  backHref,
  backLabel,
  count,
  action
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  /** Where Back goes, for screen readers ("Back to Events"). */
  backLabel?: string;
  /** A small number beside the title, e.g. how many events. */
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.pageHeading}>
      <div className={styles.pageHeadingRow}>
        {backHref && (
          <Link href={backHref} className={styles.backButton} aria-label={backLabel ? `Back to ${backLabel}` : "Back"}>
            <ChevronLeftIcon />
          </Link>
        )}
        <div className={styles.pageHeadingText}>
          <h1 className={styles.pageTitle}>
            {title}
            {count !== undefined && <span className={styles.titleCount}>{count}</span>}
          </h1>
          {subtitle && <p className={styles.pageSub}>{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
