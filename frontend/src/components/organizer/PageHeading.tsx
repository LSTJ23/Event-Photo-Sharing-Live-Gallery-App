import Link from "next/link";
import { ChevronLeftIcon } from "../icons";
import styles from "../organizer.module.css";

/** Back link, page title, an optional line under it (e.g. the event's name and date) and an optional button on the right. */
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
  backLabel?: string;
  /** A small number beside the title, e.g. how many events. */
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.pageHeading}>
      {backHref && (
        <Link href={backHref} className={styles.backLink}>
          <ChevronLeftIcon /> {backLabel}
        </Link>
      )}
      <div className={styles.pageHeadingRow}>
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
