// @vitest-environment jsdom
// Organizer dashboard tests:
//   22.x  Reported photos (unread dot, Keep photo, Delete photo, Resolved)
//   21.x  Events list (badges, links, "[n] reported photos" bar)
//   21.2 / 21.3  Event analytics numbers and the empty state
//   24.8  Photo capacity validation
// These pages read their data from OrganizerStore (sample data in
// lib/organizerData.ts), so each test renders inside the real provider.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = { push: vi.fn(), replace: vi.fn() };
let routeParams: Record<string, string> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useParams: () => routeParams,
  usePathname: () => "/events"
}));

import AnalyticsPage from "@/app/(organizer)/events/[id]/analytics/page";
import EventsPage from "@/app/(organizer)/events/page";
import ReportPage from "@/app/(organizer)/reports/[id]/page";
import ReportsPage from "@/app/(organizer)/reports/page";
import { OrganizerShell } from "@/components/organizer/OrganizerShell";
import { OrganizerStoreProvider, useOrganizerStore } from "@/components/organizer/OrganizerStore";

/** Shows the store's report states and photo counts, so tests can check what changed. */
function Probe() {
  const { reports, events } = useOrganizerStore();
  return (
    <div data-testid="probe">
      {reports.map((r) => `report${r.id}:${r.state}:${r.unread ? "unread" : "read"}`).join(" ")}{" "}
      {events.map((e) => `${e.id}:${e.photos.length}`).join(" ")}
    </div>
  );
}

function renderInStore(page: React.ReactNode) {
  return render(
    <OrganizerStoreProvider>
      <OrganizerShell>{page}</OrganizerShell>
      <Probe />
    </OrganizerStoreProvider>
  );
}

/** The big number shown above a label such as "Photos" or "Participants". */
const statValue = (label: string) =>
  screen
    .getAllByText(label)
    .map((element) => element.previousElementSibling)
    .find((sibling): sibling is Element => sibling !== null) as HTMLElement;

const probe = () => screen.getByTestId("probe").textContent ?? "";

beforeEach(() => {
  router.push.mockClear();
  routeParams = {};
});

describe("22.x - EO reviews reported photos", () => {
  it("lists each report with its reason and event, and unread reports have a dot", () => {
    renderInStore(<ReportsPage />);

    expect(screen.getByRole("heading", { name: "Reported photos" })).toBeInTheDocument();
    expect(screen.getByText("Inappropriate content")).toBeInTheDocument();
    expect(screen.getByText("Spam content")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Unread")).toHaveLength(2);
  });

  it("the menu shows the unread count", () => {
    renderInStore(<ReportsPage />);
    expect(screen.getAllByLabelText("2 unread").length).toBeGreaterThan(0);
  });

  it("opening a report marks it as read and lowers the unread count", async () => {
    const user = userEvent.setup();
    renderInStore(<ReportsPage />);

    await user.click(screen.getByText("Inappropriate content"));

    expect(probe()).toContain("report1:open:read");
    expect(probe()).toContain("report2:open:unread");
    expect(screen.getAllByLabelText("Unread")).toHaveLength(1);
    expect(screen.getAllByLabelText("1 unread").length).toBeGreaterThan(0);
  });

  it("the report page shows the reason, reporter, event and 'Needs review' status", () => {
    routeParams = { id: "1" };
    renderInStore(<ReportPage />);

    expect(screen.getByText("Inappropriate content")).toBeInTheDocument();
    expect(screen.getByText("Participant 14")).toBeInTheDocument();
    expect(screen.getByText("DLSU CSO Event")).toBeInTheDocument();
    expect(screen.getByText("Needs review")).toBeInTheDocument();
  });

  it("22.10 Keep photo resolves the report and leaves the photo", async () => {
    const user = userEvent.setup();
    routeParams = { id: "1" };
    renderInStore(<ReportPage />);
    expect(probe()).toContain("dlsu-cso-event:48");

    await user.click(screen.getByRole("button", { name: "Keep photo" }));

    expect(probe()).toContain("report1:resolved");
    expect(probe()).toContain("dlsu-cso-event:48"); // photo still there
    expect(router.push).toHaveBeenCalledWith("/reports");
    expect(screen.getByRole("status")).toHaveTextContent("Photo kept");
  });

  it("22.8 Delete photo asks to confirm, then removes the photo and resolves its report", async () => {
    const user = userEvent.setup();
    routeParams = { id: "1" };
    renderInStore(<ReportPage />);

    await user.click(screen.getByRole("button", { name: "Delete photo" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Remove this photo?")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Remove" }));

    expect(probe()).toContain("report1:resolved");
    expect(probe()).toContain("dlsu-cso-event:47"); // one photo gone
    expect(screen.getByRole("status")).toHaveTextContent("Photo deleted");
  });

  it("Cancel on the delete confirmation changes nothing", async () => {
    const user = userEvent.setup();
    routeParams = { id: "1" };
    renderInStore(<ReportPage />);

    await user.click(screen.getByRole("button", { name: "Delete photo" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(probe()).toContain("report1:open");
    expect(probe()).toContain("dlsu-cso-event:48");
  });

  it("a resolved report is labelled 'Resolved' and has no Delete or Keep buttons", async () => {
    const user = userEvent.setup();
    routeParams = { id: "1" };
    const { unmount } = renderInStore(<ReportPage />);
    await user.click(screen.getByRole("button", { name: "Keep photo" }));

    // The store is in memory, so look at the same store without unmounting it.
    expect(screen.getByText("Resolved")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Keep photo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete photo" })).not.toBeInTheDocument();
    unmount();
  });

  it("an unknown report id shows 'Report not found'", () => {
    routeParams = { id: "999" };
    renderInStore(<ReportPage />);
    expect(screen.getByText("Report not found.")).toBeInTheDocument();
  });
});

describe("21.x - EO events list", () => {
  it("shows each event with its date, venue and Live / Upcoming badge", () => {
    renderInStore(<EventsPage />);

    const live = screen.getByRole("region", { name: "DLSU CSO Event" });
    expect(within(live).getByText("LIVE")).toBeInTheDocument();
    expect(within(live).getByText(/Oct 14, 2026 · Manila/)).toBeInTheDocument();

    const upcoming = screen.getByRole("region", { name: "Event 2" });
    expect(within(upcoming).getByText("UPCOMING")).toBeInTheDocument();
    expect(within(upcoming).getByText(/Dec 3, 2026 · TBD/)).toBeInTheDocument();
  });

  it("Gallery, Analytics and QR code open the page of that event", () => {
    renderInStore(<EventsPage />);
    const card = screen.getByRole("region", { name: "Event 2" });

    expect(within(card).getByRole("link", { name: /Gallery/ })).toHaveAttribute("href", "/admin/e/event-2");
    expect(within(card).getByRole("link", { name: /Analytics/ })).toHaveAttribute("href", "/events/event-2/analytics");
    expect(within(card).getByRole("link", { name: /QR code/ })).toHaveAttribute("href", "/events/event-2/qr");
  });

  it("a card with pending reports shows '2 reported photos' and a Review link", () => {
    renderInStore(<EventsPage />);
    const card = screen.getByRole("region", { name: "DLSU CSO Event" });

    expect(within(card).getByText(/2 reported photos/)).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /Review/ })).toHaveAttribute("href", "/reports");
  });

  it("a card with no reports has no reports bar", () => {
    renderInStore(<EventsPage />);
    const card = screen.getByRole("region", { name: "Event 2" });
    expect(within(card).queryByText(/reported photo/)).not.toBeInTheDocument();
    expect(within(card).queryByRole("link", { name: /Review/ })).not.toBeInTheDocument();
  });
});

describe("21.2 / 21.3 - EO views event analytics", () => {
  it("shows the photo, participant and photos-per-participant numbers", () => {
    routeParams = { id: "dlsu-cso-event" };
    renderInStore(<AnalyticsPage />);

    const stat = statValue;
    expect(stat("Photos")).toHaveTextContent("48");
    expect(stat("Participants")).toHaveTextContent("22");
    expect(stat("Photos per participant")).toHaveTextContent("2.2"); // 48 / 22
    expect(screen.getByRole("heading", { name: "Photos per hour" })).toBeInTheDocument();
    expect(screen.getByText(/48 of 200 photos used \(24%\)/)).toBeInTheDocument();
  });

  it("an event with no photos shows zeros and an empty-state message, with no error", () => {
    routeParams = { id: "event-2" };
    renderInStore(<AnalyticsPage />);

    const stat = statValue;
    expect(stat("Photos")).toHaveTextContent("0");
    expect(stat("Participants")).toHaveTextContent("0");
    expect(stat("Photos per participant")).toHaveTextContent("0"); // no divide-by-zero / NaN
    expect(screen.getByText("Data will show once the event starts.")).toBeInTheDocument();
    expect(screen.queryByText(/NaN|undefined|Infinity/)).not.toBeInTheDocument();
  });

  it("an unknown event shows 'Event not found.'", () => {
    routeParams = { id: "nope" };
    renderInStore(<AnalyticsPage />);
    expect(screen.getByText("Event not found.")).toBeInTheDocument();
  });
});

describe("24.8 - photo capacity validation", () => {
  async function saveLimit(value: string) {
    const user = userEvent.setup();
    routeParams = { id: "dlsu-cso-event" };
    renderInStore(<AnalyticsPage />);
    const input = screen.getByRole("spinbutton", { name: "Photo limit" }) as HTMLInputElement;
    await user.clear(input);
    if (value) await user.type(input, value);
    await user.click(screen.getByRole("button", { name: "Save limit" }));
    return input;
  }

  // 0, negative numbers and decimals are stopped by the browser's own form
  // validation (the input has min=1 and whole-number steps), so the form is
  // never submitted and the old limit stays.
  it.each(["0", "-5", "1.5"])("does not save %j (the browser blocks it)", async (value) => {
    const input = await saveLimit(value);

    expect(input.checkValidity()).toBe(false);
    expect(screen.queryByRole("status")).not.toBeInTheDocument(); // no "Limit saved"
    expect(screen.getByText(/48 of 200 photos used/)).toBeInTheDocument();
  });

  // An empty field passes the browser check, so the page's own check shows the message.
  it("rejects an empty value with the page's own message and keeps the old limit", async () => {
    await saveLimit("");

    expect(screen.getByRole("status")).toHaveTextContent("Enter a limit of 1 or more");
    expect(screen.getByText(/48 of 200 photos used/)).toBeInTheDocument();
  });

  it("accepts a valid whole number and saves it", async () => {
    await saveLimit("500");

    expect(screen.getByRole("status")).toHaveTextContent("Limit saved");
    expect(screen.getByText(/48 of 500 photos used/)).toBeInTheDocument();
  });
});
