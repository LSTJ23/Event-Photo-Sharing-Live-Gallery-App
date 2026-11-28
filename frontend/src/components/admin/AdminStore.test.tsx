// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminEvent, EventForm } from "@/lib/adminData";

const api = vi.hoisted(() => ({ listEvents: vi.fn(), listOrganizers: vi.fn(), createEvent: vi.fn() }));
vi.mock("@/lib/adminApi", () => api);

import { AdminStoreProvider, useAdminStore } from "./AdminStore";

const form: EventForm = {
  name: "Event", venue: "Venue", organizerId: "org", hashtag: "", capacity: "100",
  date: "2027-01-01", time: "10:00", endDate: "2027-01-01", endTime: "11:00"
};
const event: AdminEvent = {
  ...form, id: "uuid", capacity: 100, status: "UPCOMING", participants: 0, photoCount: 0, covers: [], shareSlug: "public-link"
};

function Consumer() {
  const { events, createEvent, loading } = useAdminStore();
  return (
    <>
      <p>{loading ? "Loading" : events.map((e) => e.name).join(",") || "No events"}</p>
      <button onClick={() => { void createEvent(form).catch(() => {}); }}>Create</button>
    </>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  api.listEvents.mockResolvedValue([]);
  api.listOrganizers.mockResolvedValue([]);
});

describe("admin event state", () => {
  it("does not add an event when creation fails", async () => {
    api.createEvent.mockRejectedValue(new Error("Database unavailable"));
    render(<AdminStoreProvider><Consumer /></AdminStoreProvider>);
    await screen.findByText("No events");
    fireEvent.click(screen.getByText("Create"));
    await waitFor(() => expect(api.createEvent).toHaveBeenCalledOnce());
    expect(screen.getByText("No events")).toBeInTheDocument();
  });

  it("shows a saved event after creation and after reloading the provider", async () => {
    api.createEvent.mockResolvedValue(event);
    const view = render(<AdminStoreProvider><Consumer /></AdminStoreProvider>);
    await screen.findByText("No events");
    fireEvent.click(screen.getByText("Create"));
    await screen.findByText("Event");
    view.unmount();
    api.listEvents.mockResolvedValue([event]);
    render(<AdminStoreProvider><Consumer /></AdminStoreProvider>);
    await screen.findByText("Event");
  });
});
