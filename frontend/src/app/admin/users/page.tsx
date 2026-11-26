"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchIcon } from "@/components/icons";
import { initials, PageHeader } from "@/components/admin/AdminShell";
import { useFrom, useHere, withFrom } from "@/components/admin/useBackTo";
import { useAdminStore } from "@/components/admin/AdminStore";
import styles from "@/components/admin/dashboard.module.css";
import { matches } from "@/lib/adminData";

/** Every event organizer as a card, with Edit. */
export default function ManageUsersPage() {
  const { organizers, events } = useAdminStore();
  const from = useFrom();
  const here = useHere();
  const to = (href: string) => (from ? withFrom(href, here) : href);
  const [query, setQuery] = useState("");
  const shown = organizers.filter((o) => matches(query, o.org, o.person, o.email));

  return (
    <>
      <PageHeader
        title="Manage Users"
        back={from}
        action={
          <Link href={withFrom("/admin/users/create", here)} className={styles.btnDark}>
            + Create user
          </Link>
        }
      />

      <label className={styles.search}>
        <SearchIcon />
        <input type="search" placeholder="Search organizers, people or emails" aria-label="Search users" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {shown.length === 0 ? (
        <p className={styles.empty}>{organizers.length === 0 ? "No users yet. Create the first one." : "No users match your search."}</p>
      ) : (
        <div className={styles.grid}>
          {shown.map((o) => {
            const count = events.filter((e) => e.organizerId === o.id).length;
            return (
              <article key={o.id} className={styles.item}>
                <div className={styles.person}>
                  <span className={`${styles.avatar} ${styles.avatarLarge}`} aria-hidden="true">
                    {initials(o.org)}
                  </span>
                  <div>
                    <h2 className={styles.itemTitle}>{o.org}</h2>
                    <span className={`${styles.itemMeta} ${styles.ellipsis}`} style={{ display: "block" }}>
                      {o.person}
                    </span>
                  </div>
                </div>
                <div className={styles.itemBody}>
                  <span className={`${styles.itemMeta} ${styles.ellipsis}`}>{o.email}</span>
                  <span className={styles.itemMeta} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {count} event{count === 1 ? "" : "s"}
                    {o.status === "invited" ? (
                      <span className={`${styles.pill} ${styles.pillWarn}`}>Invite sent</span>
                    ) : (
                      <span className={`${styles.pill} ${styles.pillGood}`}>Active</span>
                    )}
                  </span>
                  <div className={styles.itemActions}>
                    <Link href={to(`/admin/users/${o.id}/edit`)} className={`${styles.btn} ${styles.small}`}>
                      Edit
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
