"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRightIcon, CloseIcon, MenuIcon } from "./icons";
import styles from "./organizer.module.css";

export interface DashboardLink {
  href: string;
  label: string;
  /** A red count beside the link, e.g. unread reports. */
  badge?: number;
  /** Highlight only on this exact page (for a dashboard's home link). */
  exact?: boolean;
}

/**
 * The frame shared by the organizer and admin dashboards: a top bar with
 * "Event Gallery" and a role tag, links on desktop, a slide-in menu on phones,
 * and an optional toast message.
 */
export function DashboardShell({
  role,
  homeHref,
  links,
  toast,
  children
}: {
  role: string;
  homeHref: string;
  links: DashboardLink[];
  toast?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const totalBadge = links.reduce((n, link) => n + (link.badge ?? 0), 0);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isActive = (link: DashboardLink) =>
    link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
  const badge = (link: DashboardLink) =>
    link.badge ? (
      <span className={styles.badge} aria-label={`${link.badge} new`}>
        {link.badge}
      </span>
    ) : null;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={`${styles.container} ${styles.topBarInner}`}>
          <Link href={homeHref} className={styles.brand}>
            Event Gallery <span className={styles.rolePill}>{role}</span>
          </Link>

          <nav className={styles.nav} aria-label="Main">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive(link) ? styles.navActive : ""}`}
                aria-current={isActive(link) ? "page" : undefined}
              >
                {link.label}
                {badge(link)}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <MenuIcon />
            {totalBadge > 0 && <span className={styles.badge}>{totalBadge}</span>}
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className={styles.drawerBackdrop} onClick={() => setMenuOpen(false)} />
          <nav className={styles.drawer} aria-label="Main">
            <div className={styles.drawerHeader}>
              <span className={styles.rolePill}>{role}</span>
              <button type="button" className={styles.menuButton} onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <CloseIcon />
              </button>
            </div>
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
                <span>
                  {link.label} {badge(link)}
                </span>
                <ChevronRightIcon />
              </Link>
            ))}
          </nav>
        </>
      )}

      <main className={`${styles.container} ${styles.main}`}>{children}</main>

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
