"use client";
import Link from "next/link";
import { useState } from "react";
import Icon from "./Icon";
import { useStore } from "./StoreProvider";

export default function Shell({ children }) {
  const { unreadCount, toast } = useStore();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const links = (
    <>
      <Link href="/events" onClick={close}>Events</Link>
      <Link href="/reports" onClick={close}>
        Reported photos{unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </Link>
      <Link href="/login" onClick={close}>Log out</Link>
    </>
  );

  return (
    <>
      {open && (
        <div id="drawer">
          <div className="sc" onClick={close} />
          <nav>
            <h2 style={{ padding: "0 14px 12px" }}>Organizer</h2>
            {links}
          </nav>
        </div>
      )}
      <div className="wrap">
        <header>
          <button className="ib menu" aria-label="Open menu" onClick={() => setOpen(true)}><Icon name="menu" /></button>
          <nav className="topnav" aria-label="Main">{links}</nav>
        </header>
        <main>{children}</main>
      </div>
      {toast && <div id="toast" role="status">{toast}</div>}
    </>
  );
}
