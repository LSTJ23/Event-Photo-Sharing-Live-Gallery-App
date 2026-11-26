import { describe, expect, it } from "vitest";
import {
  initialAdminReports,
  eventFormErrors,
  formatWhen,
  getStats,
  initialAdminEvents,
  initialOrganizers,
  matches,
  topEvents,
  eventTab,
  needsAttention,
  topOrganizers,
  userFormErrors,
  type EventForm
} from "./adminData";

const goodEvent: EventForm = {
  name: "Org Week",
  venue: "Henry Sy Hall",
  organizerId: "org-1",
  hashtag: "#OrgWeek2026",
  capacity: "300",
  date: "2026-12-10",
  time: "17:30",
  endDate: "2026-12-10",
  endTime: "21:00"
};

describe("getStats", () => {
  it("counts events, live events and organizers who accepted their invite", () => {
    expect(getStats(initialAdminEvents, initialOrganizers)).toEqual({ totalEvents: 3, activeEvents: 1, activeUsers: 2 });
  });
});

describe("topOrganizers", () => {
  it("ranks by photos and leaves out organizers with no events", () => {
    const top = topOrganizers(initialAdminEvents, initialOrganizers);
    expect(top.map((t) => t.organizer.id)).toEqual(["org-1", "org-2"]);
    expect(top[0].photos).toBe(48 + 126);
    expect(top[0].events).toBe(2);
  });
});

describe("formatWhen", () => {
  it("formats date and 12-hour time", () => {
    expect(formatWhen("2026-10-14", "18:00")).toBe("Oct 14, 2026 · 6:00 PM");
    expect(formatWhen("2026-10-14", "00:05")).toBe("Oct 14, 2026 · 12:05 AM");
    expect(formatWhen("2026-10-14", "18:00", "2026-10-14", "23:00")).toBe("Oct 14, 2026 · 6:00 PM – 11:00 PM");
    expect(formatWhen("2026-08-22", "17:00", "2026-08-23", "01:00")).toBe("Aug 22, 2026, 5:00 PM – Aug 23, 2026, 1:00 AM");
  });
  it("copes with a missing time or date", () => {
    expect(formatWhen("2026-12-03", "")).toBe("Dec 3, 2026");
    expect(formatWhen("", "")).toBe("Date not set");
  });
});

describe("matches", () => {
  it("is case-insensitive and empty queries match everything", () => {
    expect(matches("dlsu", "DLSU CSO Event")).toBe(true);
    expect(matches("  ", "anything")).toBe(true);
    expect(matches("xyz", "DLSU", undefined)).toBe(false);
  });
});

describe("eventFormErrors", () => {
  it("accepts a complete event", () => {
    expect(eventFormErrors(goodEvent)).toEqual({});
  });
  it("needs every field except the hashtag", () => {
    const errors = eventFormErrors({ name: "", venue: "", organizerId: "", hashtag: "", capacity: "", date: "", time: "", endDate: "", endTime: "" });
    expect(Object.keys(errors).sort()).toEqual(["capacity", "date", "endDate", "endTime", "name", "organizerId", "time", "venue"]);
  });
  it("checks the hashtag and capacity", () => {
    expect(eventFormErrors({ ...goodEvent, hashtag: "org week" }).hashtag).toBe("Use letters, numbers and underscores only.");
    expect(eventFormErrors({ ...goodEvent, hashtag: "" }).hashtag).toBe(undefined);
    expect(eventFormErrors({ ...goodEvent, capacity: "2.5" }).capacity).toBe("Enter a whole number of photos.");
    expect(eventFormErrors({ ...goodEvent, endTime: "17:00" }).endTime).toBe("The event must end after it starts.");
    expect(eventFormErrors({ ...goodEvent, endDate: "2026-12-11", endTime: "02:00" })).toEqual({}); // runs past midnight
    expect(eventFormErrors({ ...goodEvent, endDate: "2026-12-09", endTime: "23:00" }).endTime).toBe("The event must end after it starts.");
    expect(eventFormErrors({ ...goodEvent, capacity: "40" }, 48).capacity).toBe("Can't be lower than the 48 photos already shared.");
  });
});

describe("userFormErrors", () => {
  const good = { org: "DLSU CSO", person: "Maria Santos", email: "maria@dlsu.example" };
  it("accepts a new organizer", () => {
    expect(userFormErrors(good, initialOrganizers)).toEqual({});
  });
  it("rejects a bad or taken email", () => {
    expect(userFormErrors({ ...good, email: "maria@" }, initialOrganizers).email).toBe("Enter a valid email address.");
    expect(userFormErrors({ ...good, email: "Person1@org1.example" }, initialOrganizers).email).toBe(
      "There's already an account with this email."
    );
  });
  it("lets an organizer keep their own email when editing", () => {
    expect(userFormErrors({ ...good, email: "person1@org1.example" }, initialOrganizers, "org-1")).toEqual({});
  });
});

describe("needsAttention", () => {
  it("lists waiting reports, full galleries, events with no start time, then pending invites", () => {
    const full = { ...initialAdminEvents[0], capacity: 50 }; // 48 of 50
    const items = needsAttention([full, initialAdminEvents[1]], initialOrganizers, initialAdminReports);
    expect(items.map((i) => i.kind)).toEqual(["reports", "nearlyFull", "noTime", "invite"]);
    expect(items[0].title).toBe("3 reported photos in DLSU CSO Event waiting for Org 1");
    expect(items[1].title).toBe("DLSU CSO Event is 96% full");
    expect(items[2].title).toBe("Event 2 has no start time");
  });
  it("is empty when nothing needs a look", () => {
    const events = initialAdminEvents.map((e) => ({ ...e, time: e.time || "18:00", endTime: e.endTime || "21:00" }));
    const orgs = initialOrganizers.map((o) => ({ ...o, status: "active" as const }));
    expect(needsAttention(events, orgs, [])).toEqual([]);
  });
});

describe("eventTab", () => {
  it("puts live and upcoming events on Current, ended ones on Past, archived ones on Archived", () => {
    const [live, upcoming, ended] = initialAdminEvents;
    expect([eventTab(live), eventTab(upcoming), eventTab(ended)]).toEqual(["current", "current", "past"]);
    expect(eventTab({ ...ended, archived: true })).toBe("archived");
  });
});

describe("topEvents", () => {
  it("ranks by participants or photos and leaves out events with none", () => {
    expect(topEvents(initialAdminEvents, "participants").map((e) => e.id)).toEqual(["freshmen-welcome-night", "dlsu-cso-event"]);
    expect(topEvents(initialAdminEvents, "photoCount").map((e) => e.photoCount)).toEqual([126, 48]);
    expect(topEvents(initialAdminEvents, "photoCount", 1).length).toBe(1);
  });
});
