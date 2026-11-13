"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRightIcon, CloseIcon, MenuIcon } from "../icons";
import styles from "../organizer.module.css";
import { useOrganizerStore } from "./OrganizerStore";

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/reports", label: "Reported photos" },
  { href: "/login", label: "Log out" }
] as const;

/**
 * The organizer dashboard's frame: top bar with "Event Gallery · Organizer",
 * links on desktop, a slide-in menu on phones, and short toast messages.
 */
export function OrganizerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { unreadCount, toast } = useOrganizerStore();
  const [menuOpen, setMenuOpen] = useState(false);

  // Escape closes the phone menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const badge = (href: string) =>
    href === "/reports" && unreadCount > 0 ? (
      <span className={styles.badge} aria-label={`${unreadCount} unread`}>
        {unreadCount}
      </span>
    ) : null;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={`${styles.container} ${styles.topBarInner}`}>
          <Link href="/events" className={styles.brand}>
            Event Gallery <span className={styles.rolePill}>Organizer</span>
          </Link>

          <nav className={styles.nav} aria-label="Main">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive(link.href) ? styles.navActive : ""}`}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
                {badge(link.href)}
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
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className={styles.drawerBackdrop} onClick={() => setMenuOpen(false)} />
          <nav className={styles.drawer} aria-label="Main">
            <div className={styles.drawerHeader}>
              <span className={styles.rolePill}>Organizer</span>
              <button type="button" className={styles.menuButton} onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <CloseIcon />
              </button>
            </div>
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
                <span>
                  {link.label} {badge(link.href)}
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
