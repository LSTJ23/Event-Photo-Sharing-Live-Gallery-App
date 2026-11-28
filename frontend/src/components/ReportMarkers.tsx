import Link from "next/link";
import { EyeOffIcon, FlagIcon } from "./icons";
import styles from "./ReportMarkers.module.css";

/** Red flag with a count, for the corner of a reported photo in a gallery. Shows nothing at 0. */
export function ReportFlag({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className={styles.flag} title={`Reported by ${count} ${count === 1 ? "person" : "people"}`}>
      <FlagIcon size={12} /> {count}
    </span>
  );
}

/**
 * "Reported by 2 people" under a photo in the popup: red while it still needs
 * a decision, gray once the organizer kept it. "Review" either links to the
 * report (reviewHref) or opens it in place (onReview).
 */
export function ReportNote({
  count,
  open,
  reviewHref,
  onReview
}: {
  count: number;
  open: boolean;
  reviewHref?: string;
  onReview?: () => void;
}) {
  if (count <= 0) return null;
  return (
    <div className={`${styles.note} ${open ? "" : styles.noteDone}`}>
      <FlagIcon size={13} />
      Reported by {count} {count === 1 ? "person" : "people"}
      {reviewHref ? (
        <Link href={reviewHref}>Review</Link>
      ) : (
        onReview && (
          <button type="button" className={styles.review} onClick={onReview}>
            Review
          </button>
        )
      )}
    </div>
  );
}

/** "Hidden" tag for the corner of a photo an admin hid from guests. */
export function HiddenBadge({ hidden, label = "Hidden" }: { hidden?: boolean; label?: string }) {
  if (!hidden) return null;
  return (
    <span className={styles.hiddenBadge}>
      <EyeOffIcon size={12} /> {label}
    </span>
  );
}

/** In the photo popup: the photo is hidden from guests. */
export function HiddenNote({ hidden, text }: { hidden?: boolean; text: string }) {
  if (!hidden) return null;
  return (
    <div className={`${styles.note} ${styles.noteHidden}`}>
      <EyeOffIcon size={13} />
      {text}
    </div>
  );
}

/** Class names for wrapping several notes (notes) and dimming a hidden photo (dimmed). */
export const markerStyles = styles;
