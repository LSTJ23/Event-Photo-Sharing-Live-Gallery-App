// @vitest-environment jsdom
// Plan tests 3.7 (an EO cannot open admin pages) and 3.9 / 3.11 (dashboards are
// closed to anyone who is not signed in). Page guards under test: OrganizerOnly
// (organizer pages) and AdminOnly (admin pages) in components/OrganizerOnly.tsx.
//
// These check what the SCREEN does. The backend must still refuse the same
// requests itself, because anyone can skip the screen.
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ state: { status: "loading" } as { status: string; user?: unknown } }));
vi.mock("@/components/useCurrentUser", () => ({ useCurrentUser: () => session.state }));

import { AdminOnly, OrganizerOnly } from "@/components/OrganizerOnly";

type Role = "participant" | "organizer" | "admin";
const signedIn = (role: Role, mustChangePassword = false) => ({
  status: "ready",
  user: { id: `${role}-1`, name: role, email: `${role}@example.com`, role, mustChangePassword }
});

const SECRET = "secret dashboard content";
const organizerPage = () => render(<OrganizerOnly><p>{SECRET}</p></OrganizerOnly>);
const adminPage = () => render(<AdminOnly><p>{SECRET}</p></AdminOnly>);

beforeEach(() => {
  session.state = { status: "loading" };
});

describe("3.9 / 3.11 - dashboards are closed when not signed in", () => {
  it.each([
    ["organizer dashboard", organizerPage, "This page is for event organizers"],
    ["admin dashboard", adminPage, "This page is for admins"]
  ])("the %s shows a login link and no content", (_name, open, heading) => {
    session.state = { status: "signedOut" };
    open();

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to login" })).toHaveAttribute("href", "/portal");
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  it.each([
    ["organizer dashboard", organizerPage],
    ["admin dashboard", adminPage]
  ])("the %s shows nothing but a waiting message while the session is checked", (_name, open) => {
    open();
    expect(screen.getByText("Checking your session...")).toBeInTheDocument();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  it.each([
    ["organizer dashboard", organizerPage],
    ["admin dashboard", adminPage]
  ])("the %s shows an error, not the content, if the session can't be checked", (_name, open) => {
    session.state = { status: "error" };
    open();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to check your session");
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  it("someone signed out after being signed in (for example by Log out) loses access", () => {
    session.state = signedIn("admin");
    const { rerender } = adminPage();
    expect(screen.getByText(SECRET)).toBeInTheDocument();

    session.state = { status: "signedOut" };
    rerender(<AdminOnly><p>{SECRET}</p></AdminOnly>);
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });
});

describe("3.7 - each role only sees its own pages", () => {
  it("an organizer can open organizer pages", () => {
    session.state = signedIn("organizer");
    organizerPage();
    expect(screen.getByText(SECRET)).toBeInTheDocument();
  });

  it("an organizer cannot open admin pages", () => {
    session.state = signedIn("organizer");
    adminPage();

    expect(screen.getByRole("heading", { name: "This page is for admins" })).toBeInTheDocument();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  it("an admin can open admin pages and organizer pages", () => {
    session.state = signedIn("admin");
    const first = adminPage();
    expect(screen.getByText(SECRET)).toBeInTheDocument();
    first.unmount();

    organizerPage();
    expect(screen.getByText(SECRET)).toBeInTheDocument();
  });

  it.each([
    ["organizer pages", organizerPage],
    ["admin pages", adminPage]
  ])("a participant cannot open %s", (_name, open) => {
    session.state = signedIn("participant");
    open();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to login" })).toBeInTheDocument();
  });

  it.each([
    ["organizer", organizerPage],
    ["admin", adminPage]
  ])("a %s who still has to change their password cannot open the dashboard", (role, open) => {
    session.state = signedIn(role as Role, true);
    open();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });
});
