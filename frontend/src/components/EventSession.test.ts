import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const { usePathname, useCurrentUser } = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useCurrentUser: vi.fn()
}));
vi.mock("next/navigation", () => ({ usePathname }));
vi.mock("./useCurrentUser", () => ({ useCurrentUser }));
vi.mock("@/lib/auth", () => ({ AuthRequestError: class extends Error {}, getParticipantEvent: vi.fn() }));
vi.mock("@/lib/api", () => ({ getEvent: vi.fn() }));

import { EventSession } from "./EventSession";

beforeEach(() => {
  useCurrentUser.mockReturnValue({ status: "signedOut" });
});

it("allows the event share-link redirect to render before sign-in", () => {
  usePathname.mockReturnValue("/e/event-1");
  const html = renderToStaticMarkup(createElement(EventSession, { eventId: "event-1" }, "Share link"));
  expect(html).toContain("Share link");
  expect(html).not.toContain("Sign in to continue");
});

it("requires a session on the event camera", () => {
  usePathname.mockReturnValue("/e/event-1/camera");
  const html = renderToStaticMarkup(createElement(EventSession, { eventId: "event-1" }, "Camera"));
  expect(html).toContain("Sign in to continue");
  expect(html).not.toContain(">Camera<");
});
