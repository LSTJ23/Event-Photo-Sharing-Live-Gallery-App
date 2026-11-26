import type { Photo } from "./types";
import { makeZip, type ZipEntry } from "./zip";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
  "image/heic": "heic"
};

/** "DLSU CSO Event" → "dlsu-cso-event" for the zip's file name. */
export const fileSafe = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "event";

/**
 * Downloads every photo of an event as one .zip file (photo-001.jpg, …,
 * oldest first). Returns how many photos went in.
 *
 * TODO (backend): for big events this is better done on the server, which can
 * zip the originals straight from storage.
 */
export async function downloadAllPhotos(eventName: string, photos: Photo[]): Promise<number> {
  const ordered = [...photos].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const entries: ZipEntry[] = [];
  for (const [i, photo] of ordered.entries()) {
    const response = await fetch(photo.url);
    if (!response.ok) throw new Error(`Couldn't fetch photo ${photo.id}`);
    const blob = await response.blob();
    const ext = EXTENSIONS[blob.type.split(";")[0]] ?? "jpg";
    entries.push({ name: `photo-${String(i + 1).padStart(3, "0")}.${ext}`, data: new Uint8Array(await blob.arrayBuffer()) });
  }
  const zip = makeZip(entries);
  const url = URL.createObjectURL(new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileSafe(eventName)}-photos.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return entries.length;
}

/** Downloads one photo, named after the event and its number, e.g. dlsu-cso-event-photo-3.jpg. */
export async function downloadPhoto(eventName: string, photo: Photo, number: number): Promise<void> {
  const response = await fetch(photo.url);
  if (!response.ok) throw new Error(`Couldn't fetch photo ${photo.id}`);
  const blob = await response.blob();
  const ext = EXTENSIONS[blob.type.split(";")[0]] ?? "jpg";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileSafe(eventName)}-photo-${number}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
