"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { initials } from "./admin/AdminShell";
import frame from "./admin/dashboard.module.css";
import { CloseIcon, MenuIcon } from "./icons";
import styles from "./organizer.module.css";
import { getCurrentUser } from "@/lib/currentUser";

export interface DashboardLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
  /** A red count beside the link, e.g. unread reports. */
  badge?: number;
  /** Highlight only on this exact page (for a dashboard's home link). */
  exact?: boolean;
}

/**
 * The organizer dashboard's frame, laid out like the admin's: a sidebar with
 * the links on wide screens, a top bar with a slide-in menu on phones and
 * tablets, the signed-in user and Log out at the bottom, and an optional toast.
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

  const brand = (
    <Link href={homeHref} className={frame.brand}>
      Event Gallery <span className={frame.rolePill}>{role}</span>
    </Link>
  );

  const nav = (onNavigate?: () => void) =>
    links.map((link) => {
      const active = isActive(link);
      return (
        <Link
          key={link.href}
          href={link.href}
          className={`${frame.navLink} ${active ? frame.navActive : ""}`}
          aria-current={active ? "page" : undefined}
          onClick={onNavigate}
        >
          {link.icon}
          <span style={{ flex: 1 }}>{link.label}</span>
          {link.badge ? (
            <span className={styles.badge} aria-label={`${link.badge} new`}>
              {link.badge}
            </span>
          ) : null}
        </Link>
      );
    });

  const user = getCurrentUser();
  const foot = (
    <div className={frame.sideFoot}>
      <span className={frame.avatar} aria-hidden="true">
        {initials(user.name)}
      </span>
      <span>
        {user.name}
        <br />
        <span className={frame.muted}>{role}</span>
      </span>
      <Link href="/login" className={frame.textButton}>
        Log out
      </Link>
    </div>
  );

  return (
    <div className={`${frame.shell} ${styles.shellOrganizer}`}>
      <nav className={frame.sidebar} aria-label={role}>
        {brand}
        {nav()}
        {foot}
      </nav>

      <header className={frame.topBar}>
        <button type="button" className={`${frame.menuButton} ${styles.menuWithBadge}`} onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
          <MenuIcon />
          {totalBadge > 0 && <span className={styles.badge}>{totalBadge}</span>}
        </button>
        {brand}
      </header>

      {menuOpen && (
        <>
          <div className={frame.backdrop} onClick={() => setMenuOpen(false)} />
          <nav className={frame.drawer} aria-label={`${role} menu`}>
            <div className={frame.drawerHead}>
              {brand}
              <button type="button" className={frame.menuButton} onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <CloseIcon />
              </button>
            </div>
            {nav(() => setMenuOpen(false))}
            {foot}
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
