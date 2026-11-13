// Stand-in backend used until the real API exists. Everything lives in memory
// in the browser tab, so data resets on a full page reload and isn't shared
// between devices.
import { getCurrentUser } from "./currentUser";
import { sharedByLabel } from "./sharedBy";
import type { EventInfo, Photo } from "./types";

const events: EventInfo[] = [
  { id: "dlsu-cso-event", name: "DLSU CSO Event", date: "2026-10-14", location: "Manila", shareLinkActive: true },
  { id: "event-2", name: "Event 2", date: "2026-12-03", location: "TBD", shareLinkActive: true }
];

function placeholderImage(n: number): string {
  const hue = (n * 47) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue} 35% 78%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 30% 58%)"/>
</linearGradient></defs>
<rect width="900" height="1200" fill="url(#g)"/>
<circle cx="450" cy="520" r="150" fill="white" fill-opacity="0.25"/>
<text x="450" y="560" font-family="Arial, sans-serif" font-size="110" text-anchor="middle" fill="white" fill-opacity="0.85">${n}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const sampleNames = ["Maria Santos", "Paolo Reyes", "Bea Cruz", "Miguel Tan", "Andrea Lim", "Carlo Garcia"];

// 24 sample photos, the newest first, spread across the event evening (Manila time).
// Every third one was shared anonymously.
const photos: Photo[] = Array.from({ length: 24 }, (_, i) => {
  const n = 24 - i;
  return {
    id: `sample-${n}`,
    eventId: "dlsu-cso-event",
    url: placeholderImage(n),
    sharedBy: sharedByLabel(sampleNames[n % sampleNames.length], n % 3 === 0),
    createdAt: new Date(Date.UTC(2026, 9, 14, 10, 30 + n * 3)).toISOString()
  };
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getEvent(eventId: string): Promise<EventInfo | null> {
  await wait(150);
  return events.find((event) => event.id === eventId) ?? null;
}

export async function listPhotos(eventId: string): Promise<Photo[]> {
  await wait(150);
  return photos.filter((photo) => photo.eventId === eventId);
}

export async function uploadPhoto(eventId: string, image: Blob, options: { anonymous: boolean }): Promise<Photo> {
  await wait(700);
  const photo: Photo = {
    id: `local-${Date.now()}`,
    eventId,
    url: URL.createObjectURL(image),
    sharedBy: sharedByLabel(getCurrentUser().name, options.anonymous),
    createdAt: new Date().toISOString()
  };
  photos.unshift(photo);
  return photo;
}

export async function removePhotos(eventId: string, photoIds: string[]): Promise<void> {
  await wait(400);
  const remove = new Set(photoIds);
  for (let i = photos.length - 1; i >= 0; i--) {
    if (photos[i].eventId === eventId && remove.has(photos[i].id)) photos.splice(i, 1);
  }
}
