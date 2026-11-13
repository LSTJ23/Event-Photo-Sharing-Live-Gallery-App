// The one place the frontend talks to the backend.
//
// While NEXT_PUBLIC_API_URL is unset, every call goes to the in-browser mock in
// ./mockApi. Once the Express API has these routes, set NEXT_PUBLIC_API_URL
// (e.g. http://localhost:3001) and the screens use it with no other changes.
//
// Routes the frontend expects from the backend:
//   GET  /events/:eventId          → EventInfo            (404 if no such event)
//   GET  /events/:eventId/photos   → Photo[]              (newest first)
//   POST /events/:eventId/photos   multipart fields "photo" (the image) and
//                                  "anonymous" ("true" | "false") → Photo (201)
//
//   DELETE /events/:eventId/photos/:photoId                  → 204 (admins only)
//
// For uploads, the backend should take the name from the signed-in user and
// return sharedBy as "Anonymous" when anonymous is "true", so a hidden name
// never reaches other participants.
import * as mock from "./mockApi";
import type { EventInfo, Photo } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getEvent(eventId: string): Promise<EventInfo | null> {
  if (!API_URL) return mock.getEvent(eventId);
  try {
    return await request<EventInfo>(`/events/${encodeURIComponent(eventId)}`);
  } catch (error) {
    if (error instanceof Error && error.message.endsWith("status 404")) return null;
    throw error;
  }
}

export async function listPhotos(eventId: string): Promise<Photo[]> {
  if (!API_URL) return mock.listPhotos(eventId);
  return request<Photo[]>(`/events/${encodeURIComponent(eventId)}/photos`);
}

export interface UploadOptions {
  /** Hide the participant's name in the gallery. */
  anonymous: boolean;
}

export async function uploadPhoto(eventId: string, image: Blob, options: UploadOptions): Promise<Photo> {
  if (!API_URL) return mock.uploadPhoto(eventId, image, options);
  const body = new FormData();
  body.append("photo", image, "photo.jpg");
  body.append("anonymous", String(options.anonymous));
  return request<Photo>(`/events/${encodeURIComponent(eventId)}/photos`, { method: "POST", body });
}

/** Admins only: removes photos from the event gallery for everyone. */
export async function removePhotos(eventId: string, photoIds: string[]): Promise<void> {
  if (!API_URL) return mock.removePhotos(eventId, photoIds);
  await Promise.all(
    photoIds.map(async (photoId) => {
      const response = await fetch(
        `${API_URL}/events/${encodeURIComponent(eventId)}/photos/${encodeURIComponent(photoId)}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error(`Removing photo ${photoId} failed with status ${response.status}`);
    })
  );
}
