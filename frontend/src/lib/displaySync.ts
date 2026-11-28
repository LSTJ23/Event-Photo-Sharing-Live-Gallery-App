// Keeps the presenter view and the audience screen in step, like PowerPoint's
// presenter view: the presenter (laptop) controls what the audience screen
// (projector or TV) shows. Both are windows of the same browser, so they talk
// through a BroadcastChannel. No server needed.
import type { Photo } from "./types";

export type DisplayView = "slideshow" | "grid";

/** Sent by the presenter whenever something changes. */
export interface DisplayState {
  type: "state";
  eventName: string;
  view: DisplayView;
  playing: boolean;
  showQr: boolean;
  intervalMs: number;
  /** Bumps every time the slide changes, to restart the progress bar. */
  slideKey: number;
  photo: Photo | null;
  /** All photos, newest first, for the grid view. */
  photos: Photo[];
}

/** Sent by the audience screen when it opens, then every couple of seconds. */
export interface DisplayHello {
  type: "hello";
}

/** Sent by the presenter to close the audience window (Exit). */
export interface DisplayClose {
  type: "close";
}

export type DisplayMessage = DisplayState | DisplayHello | DisplayClose;

export const channelName = (eventId: string) => `event-gallery-display:${eventId}`;

/** Opens the channel, or returns null where the browser doesn't support it. */
export function openChannel(eventId: string): BroadcastChannel | null {
  return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(channelName(eventId));
}

export const SLIDE_SPEEDS = [4000, 6000, 10000, 15000];
