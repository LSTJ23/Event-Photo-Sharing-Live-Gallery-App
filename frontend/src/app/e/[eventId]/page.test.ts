import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import EventLinkPage from "./page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("event share link", () => {
  it("preserves the event id when opening participant access", async () => {
    await EventLinkPage({ params: Promise.resolve({ eventId: "event & one" }) });
    expect(redirect).toHaveBeenCalledWith("/portal?event=event%20%26%20one");
  });
});
