"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarIcon, ChartIcon, CheckIcon, ChevronRightIcon, FlagIcon, PlusCircleIcon, StarIcon, UsersIcon } from "@/components/icons";
import { PageHeader } from "@/components/admin/AdminShell";
import { ReportDetails } from "@/components/admin/ReportDetails";
import { useAdminStore } from "@/components/admin/AdminStore";
import { withFrom } from "@/components/admin/useBackTo";
import styles from "@/components/admin/dashboard.module.css";
import { needsAttention, reportStats, type AttentionItem } from "@/lib/adminData";

function Shortcut({ href, icon, label, hint, light }: { href: string; icon: React.ReactNode; label: string; hint: string; light?: boolean }) {
  return (
    <Link href={href} className={styles.shortcut}>
      <span className={`${styles.shortcutIcon} ${light ? styles.shortcutIconLight : ""}`}>{icon}</span>
      <span className={styles.shortcutText}>
        {label}
        <span>{hint}</span>
      </span>
    </Link>
  );
}

/** Admin home: shortcuts to events and users, and a quick look at the report numbers. */
export default function AdminHomePage() {
  const { events, organizers, reports, getEvent, getOrganizer, resendInvite } = useAdminStore();
  // The event whose waiting reported photos are open in the popup.
  const [viewing, setViewing] = useState<string | null>(null);
  const viewingReports = reports.filter((r) => r.eventId === viewing && r.state === "waiting").sort((a, b) => b.count - a.count);
  const stats = reportStats(reports);
  const items = needsAttention(events, organizers, reports);

  const remind = (eventId: string) => {
    const event = getEvent(eventId);
    const org = event && getOrganizer(event.organizerId);
    if (event && org) window.location.assign(`mailto:${org.email}?subject=${encodeURIComponent(`Reported photos in ${event.name}`)}`);
  };

  const icon = (item: AttentionItem) => {
    const map = { reports: <FlagIcon size={18} />, nearlyFull: <ChartIcon size={18} />, noTime: <CalendarIcon size={18} />, invite: <UsersIcon size={18} /> };
    const tone = { reports: styles.toneReport, nearlyFull: styles.toneWarn, noTime: styles.toneTime, invite: styles.toneInvite };
    return <span className={`${styles.todoIcon} ${tone[item.kind]}`}>{map[item.kind]}</span>;
  };

  const actions = (item: AttentionItem) => {
    const small = `${styles.btn} ${styles.small}`;
    if (item.kind === "reports")
      return (
        <>
          <button type="button" className={small} onClick={() => setViewing(item.id)}>
            View
          </button>
          <button type="button" className={small} onClick={() => remind(item.id)}>
            Remind organizer
          </button>
        </>
      );
    if (item.kind === "nearlyFull")
      return (
        <Link href={withFrom(`/admin/events/${item.id}/edit`, "/admin")} className={small}>
          Raise capacity
        </Link>
      );
    if (item.kind === "noTime")
      return (
        <Link href={withFrom(`/admin/events/${item.id}/edit`, "/admin")} className={small}>
          Set time
        </Link>
      );
    return (
      <button type="button" className={small} onClick={() => resendInvite(item.id)}>
        Resend invite
      </button>
    );
  };

  return (
    <>
      <PageHeader title="Hello, Admin!" subtitle="What would you like to do today?" />

      <section className={styles.card} aria-labelledby="todo-title">
        <div className={styles.cardHead}>
          <h2 id="todo-title" className={styles.cardTitle}>
            Needs your attention
            {items.length > 0 && <span className={styles.countPill}>{items.length}</span>}
          </h2>
        </div>
        {items.length === 0 ? (
          <p className={styles.allClear}>
            <CheckIcon size={18} /> All caught up. Nothing needs a look right now.
          </p>
        ) : (
          items.map((item) => (
            <div key={`${item.kind}-${item.id}`} className={styles.todo}>
              {icon(item)}
              <span className={styles.todoText}>
                <b>{item.title}</b>
                <br />
                <span className={styles.muted}>{item.detail}</span>
              </span>
              <span className={styles.todoActions}>{actions(item)}</span>
            </div>
          ))
        )}
      </section>

      <div className={styles.groups}>
        <section className={styles.card} aria-labelledby="events-group">
          <h2 id="events-group" className={styles.groupLabel}>
            Events
          </h2>
          <div className={styles.shortcuts}>
            <Shortcut href={withFrom("/admin/events/create", "/admin")} icon={<PlusCircleIcon />} label="Create Event" hint="Set it up and assign an organizer" />
            <Shortcut href={withFrom("/admin/events", "/admin")} icon={<StarIcon />} label="Manage Events" hint={`${events.length} events`} light />
          </div>
        </section>
        <section className={styles.card} aria-labelledby="users-group">
          <h2 id="users-group" className={styles.groupLabel}>
            Users
          </h2>
          <div className={styles.shortcuts}>
            <Shortcut href={withFrom("/admin/users/create", "/admin")} icon={<PlusCircleIcon />} label="Create User" hint="Add an event organizer" />
            <Shortcut href={withFrom("/admin/users", "/admin")} icon={<UsersIcon />} label="Manage Users" hint={`${organizers.length} organizers`} light />
          </div>
        </section>
      </div>

      <section className={styles.card} aria-labelledby="overview-title">
        <div className={styles.cardHead}>
          <h2 id="overview-title" className={styles.cardTitle}>
            Report Logs Overview
          </h2>
          <Link href={withFrom("/admin/reports", "/admin")} className={`${styles.btn} ${styles.small}`}>
            View details <ChevronRightIcon />
          </Link>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Waiting for organizer</div>
            <div className={styles.statValue}>{stats.waiting}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Kept or removed</div>
            <div className={styles.statValue}>{stats.kept + stats.removed}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Reports in total</div>
            <div className={styles.statValue}>{stats.totalReports}</div>
          </div>
        </div>
      </section>
      {viewing && viewingReports.length > 0 && <ReportDetails key={viewing} reports={viewingReports} onClose={() => setViewing(null)} />}
    </>
  );
}
