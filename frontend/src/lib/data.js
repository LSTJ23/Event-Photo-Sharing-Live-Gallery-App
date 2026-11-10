export const shade = (i) => {
  const v = 150 + ((i * 37) % 80);
  return `rgb(${v},${v},${v})`;
};
const makePhotos = (n) => Array.from({ length: n }, (_, i) => ({ id: i, shade: shade(i) }));

export const initialEvents = [
  {
    id: 1, name: "Event 1", when: "Nov 12, 2026", venue: "Makati Convention Hall",
    status: "LIVE", joinUrl: "https://yourapp.com/join/Event-1", qrImageUrl: null, participants: 22, capacity: 200,
    photos: makePhotos(48),
    hours: [["6 PM", 2], ["7 PM", 5], ["8 PM", 9], ["9 PM", 14], ["10 PM", 8], ["11 PM", 6], ["12 AM", 4]],
  },
  {
    id: 2, name: "Event 2", when: "Dec 03, 2026", venue: "TBD",
    status: "UPCOMING", joinUrl: "https://yourapp.com/join/Event-2", qrImageUrl: null, participants: 0, capacity: 300,
    photos: [], hours: [],
  },
];

export const initialReports = [
  { id: 1, ev: 1, photo: 7, reason: "Inappropriate content", by: "Participant 14", time: "10 min ago", unread: true, state: "open" },
  { id: 2, ev: 1, photo: 23, reason: "spam content", by: "Participant 3", time: "42 min ago", unread: true, state: "open" },
];