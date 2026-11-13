import Link from "next/link";
import { ChevronLeftIcon } from "../icons";
import styles from "../organizer.module.css";

/** Back link, page title and an optional line under it (e.g. the event's name and date). */
export function PageHeading({
  title,
  subtitle,
  backHref,
  backLabel
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className={styles.pageHeading}>
      {backHref && (
        <Link href={backHref} className={styles.backLink}>
          <ChevronLeftIcon /> {backLabel}
        </Link>
      )}
      <h1 className={styles.pageTitle}>{title}</h1>
      {subtitle && <p className={styles.pageSub}>{subtitle}</p>}
    </div>
  );
}
