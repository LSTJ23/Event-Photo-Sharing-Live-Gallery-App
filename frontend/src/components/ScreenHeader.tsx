import Link from "next/link";
import { ChevronLeftIcon } from "./icons";
import styles from "./flow.module.css";

interface ScreenHeaderProps {
  title: string;
  backHref?: string;
  /** Optional control on the right, e.g. a close button. */
  right?: React.ReactNode;
}

export function ScreenHeader({ title, backHref, right }: ScreenHeaderProps) {
  return (
    <header className={backHref || right ? `${styles.header} ${styles.headerWithSides}` : styles.header}>
      <div className={styles.headerSide}>
        {backHref && (
          <Link href={backHref} className={styles.back}>
            <ChevronLeftIcon /> Back
          </Link>
        )}
      </div>
      <h1 className={styles.headerTitle}>{title}</h1>
      <div className={`${styles.headerSide} ${styles.headerRight}`}>{right}</div>
    </header>
  );
}
