"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChartIcon, ChevronLeftIcon, CloseIcon, FlagIcon, GalleryIcon, MenuIcon, StarIcon, UsersIcon } from "../icons";
import { AdminStoreProvider, useAdminStore } from "./AdminStore";
import { getCurrentUser } from "@/lib/currentUser";
import styles from "./dashboard.module.css";

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** A page's title row: an optional back arrow, the title, and an optional button. */
export function PageHeader({
  title,
  back,
  subtitle,
  action
}: {
  title: string;
  /** Where the back arrow goes (create and edit pages). */
  back?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.pageHeader}>
      {back && (
        <Link href={back} className={styles.backButton} aria-label="Back">
          <ChevronLeftIcon />
        </Link>
      )}
      <div className={styles.pageHeaderText}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const LINKS = [
  { href: "/admin", label: "Home", icon: <GalleryIcon size={20} />, exact: true },
  { href: "/admin/events", label: "Events", icon: <StarIcon size={20} /> },
  { href: "/admin/users", label: "Users", icon: <UsersIcon size={20} /> },
  { href: "/admin/reports", label: "Report Logs", icon: <FlagIcon size={20} /> },
  { href: "/admin/analytics", label: "Analytics", icon: <ChartIcon size={20} /> }
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <Link href="/admin/events/create" className={`${styles.btnDark} ${styles.navCreate}`} onClick={onNavigate}>
        + Create event
      </Link>
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${active ? styles.navActive : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
          >
            {link.icon}
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function UserFoot() {
  const user = getCurrentUser();
  return (
    <div className={styles.sideFoot}>
      <span className={styles.avatar} aria-hidden="true">
        {initials(user.name)}
      </span>
      <span>
        {user.name}
        <br />
        <span className={styles.muted}>Admin</span>
      </span>
      <Link href="/login" className={styles.textButton}>
        Log out
      </Link>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const { toast } = useAdminStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const brand = (
    <Link href="/admin" className={styles.brand}>
      Event Gallery <span className={styles.rolePill}>Admin</span>
    </Link>
  );

  return (
    <div className={styles.shell}>
      <nav className={styles.sidebar} aria-label="Admin">
        {brand}
        <Nav />
        <UserFoot />
      </nav>

      <header className={styles.topBar}>
        {brand}
        <button type="button" className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
          <MenuIcon />
        </button>
      </header>

      {menuOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />
          <nav className={styles.drawer} aria-label="Admin menu">
            <div className={styles.drawerHead}>
              {brand}
              <button type="button" className={styles.menuButton} onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <CloseIcon />
              </button>
            </div>
            <Nav onNavigate={() => setMenuOpen(false)} />
            <UserFoot />
          </nav>
        </>
      )}

      <main className={styles.main}>{children}</main>

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

/** The admin dashboard's frame: sidebar (a menu on phones), sample data store and toast messages. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminStoreProvider>
      <Frame>{children}</Frame>
    </AdminStoreProvider>
  );
}
