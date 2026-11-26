"use client";

import { usePathname, useSearchParams } from "next/navigation";

// Back arrows, Cancel and Save go back to the page you came from. A link adds
// ?from=<that page> (see withFrom); without it, the page's usual parent is used.

/** Adds ?from=<page> to a link so the next page's Back returns there. */
export function withFrom(href: string, from: string): string {
  return `${href}${href.includes("?") ? "&" : "?"}from=${encodeURIComponent(from)}`;
}

/** Where this page's Back should go: the ?from= page if it's one of ours, otherwise the fallback. */
export function useBackTo(fallback: string): string {
  const from = useSearchParams().get("from");
  return from && from.startsWith("/") && !from.startsWith("//") ? from : fallback;
}

/** The ?from= page, if any: sidebar pages show a back arrow only when opened from another page. */
export function useFrom(): string | undefined {
  const back = useBackTo("");
  return back || undefined;
}

/** This page's own address, ?from= included, for links that should come back here. */
export function useHere(): string {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  return query ? `${pathname}?${query}` : pathname;
}
