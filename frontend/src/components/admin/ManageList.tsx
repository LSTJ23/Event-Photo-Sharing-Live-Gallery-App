"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchIcon } from "./Icons";

export type ManageItem = {
  id: string;
  name: string;
  actions: { label: string; href: string }[];
};

type Props = {
  items: ManageItem[];
  addHref: string;
  placeholder?: string;
  emptyText?: string;
};

export default function ManageList({ items, addHref, placeholder = "Search", emptyText = "No results" }: Props) {
  const [q, setQ] = useState("");
  const filtered = items.filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="manage">
      <div className="search">
        <SearchIcon />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        <Link href={addHref} className="add" aria-label="Add new">+</Link>
      </div>

      <div className="cards">
        {filtered.length === 0 && <p className="empty">{emptyText}</p>}
        {filtered.map((item) => (
          <article className="card" key={item.id}>
            <div className="thumb">{item.name}</div>
            <div className="actions">
              {item.actions.map((a) => (
                <Link key={a.label} href={a.href}>{a.label}</Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
