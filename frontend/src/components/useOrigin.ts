"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/**
 * The site's address, e.g. "https://eventgallery.com", for building links.
 * Empty while the page is first drawn on the server; filled in the browser.
 */
export function useOrigin(): string {
  return useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => ""
  );
}
