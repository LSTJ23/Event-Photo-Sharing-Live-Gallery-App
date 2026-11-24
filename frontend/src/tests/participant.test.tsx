// @vitest-environment jsdom
// Participant-side and sharing tests:
//   1.2   "Event not found" / error screens (EventSession)
//   11.x  Share page: anonymous switch text, and what is sent when sharing
//   26.x  Copy Link in the share-link dialog
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const EVENT = { id: "test-event", name: "Test Event", date: "2026-10-14", shareLinkActive: true };
vi.mock("@/lib/api", () => ({
  getEvent: vi.fn(),
  uploadPhoto: vi.fn()
}));

import { EventSession, useEventSession } from "@/components/EventSession";
import { ShareLinkModal } from "@/components/ShareLinkModal";
import SharePage from "@/app/e/[eventId]/share/page";
import { getEvent, uploadPhoto } from "@/lib/api";

beforeEach(() => {
  vi.mocked(getEvent).mockReset().mockResolvedValue(EVENT);
  vi.mocked(uploadPhoto).mockReset().mockResolvedValue({
    id: "new",
    eventId: EVENT.id,
    url: "blob:x",
    sharedBy: "Test User",
    createdAt: new Date().toISOString()
  });
  router.push.mockClear();
  router.replace.mockClear();
  // jsdom has no object URLs.
  URL.createObjectURL = vi.fn(() => "blob:fake-photo");
  URL.revokeObjectURL = vi.fn();
});

describe("1.2 - event screens", () => {
  it("shows the event's page content when the event exists", async () => {
    render(
      <EventSession eventId={EVENT.id}>
        <p>inside the event</p>
      </EventSession>
    );
    expect(screen.getByText("Loading event…")).toBeInTheDocument();
    expect(await screen.findByText("inside the event")).toBeInTheDocument();
    expect(getEvent).toHaveBeenCalledWith(EVENT.id);
  });

  it("an event that does not exist shows 'Event not found' and no event content", async () => {
    vi.mocked(getEvent).mockResolvedValue(null);
    render(
      <EventSession eventId="no-such-event">
        <p>inside the event</p>
      </EventSession>
    );

    expect(await screen.findByRole("heading", { name: "Event not found" })).toBeInTheDocument();
    expect(screen.queryByText("inside the event")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Scan again" })).toHaveAttribute("href", "/scan");
  });

  it("a failed lookup shows 'Something went wrong' and no event content", async () => {
    vi.mocked(getEvent).mockRejectedValue(new Error("network"));
    render(
      <EventSession eventId={EVENT.id}>
        <p>inside the event</p>
      </EventSession>
    );

    expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.queryByText("inside the event")).not.toBeInTheDocument();
  });

  it("the organizer version shows the same message in the admin layout", async () => {
    vi.mocked(getEvent).mockResolvedValue(null);
    render(
      <EventSession eventId="no-such-event" variant="admin">
        <p>inside the event</p>
      </EventSession>
    );
    expect(await screen.findByRole("heading", { name: "Event not found" })).toBeInTheDocument();
  });
});

describe("11.x - share page and anonymous switch", () => {
  /** Renders the share page with a photo already taken (the draft). */
  function ShareWithDraft() {
    const { setDraft } = useEventSession();
    const [ready, setReady] = useState(false);
    useEffect(() => {
      setDraft(new Blob(["photo"], { type: "image/jpeg" }));
      setReady(true);
    }, [setDraft]);
    return ready ? <SharePage /> : null;
  }

  async function openSharePage() {
    render(
      <EventSession eventId={EVENT.id}>
        <ShareWithDraft />
      </EventSession>
    );
    await screen.findByText("Ready to Share?");
  }

  const anonymousSwitch = () => screen.getByRole("switch", { name: "Share anonymously" });

  it("starts with the switch off and shows the name that will be used", async () => {
    await openSharePage();
    expect(anonymousSwitch()).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Shown in the gallery as Test User.")).toBeInTheDocument();
  });

  it("turning the switch on changes the text, and turning it off changes it back", async () => {
    const user = userEvent.setup();
    await openSharePage();

    await user.click(anonymousSwitch());
    expect(anonymousSwitch()).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Your name won't be shown in the gallery.")).toBeInTheDocument();

    await user.click(anonymousSwitch());
    expect(screen.getByText("Shown in the gallery as Test User.")).toBeInTheDocument();
  });

  it("sharing with a name uploads with anonymous = false and shows 'Photo shared!'", async () => {
    const user = userEvent.setup();
    await openSharePage();

    await user.click(screen.getByRole("button", { name: "Share Photo" }));

    expect(await screen.findByRole("heading", { name: "Photo shared!" })).toBeInTheDocument();
    expect(uploadPhoto).toHaveBeenCalledWith(EVENT.id, expect.any(Blob), { anonymous: false });
    expect(screen.getByText(/Everyone at the event can now see it\./)).not.toHaveTextContent("anonymously");
    expect(screen.getByRole("link", { name: "View event gallery" })).toHaveAttribute("href", `/e/${EVENT.id}/gallery`);
  });

  it("sharing anonymously uploads with anonymous = true and says so", async () => {
    const user = userEvent.setup();
    await openSharePage();

    await user.click(anonymousSwitch());
    await user.click(screen.getByRole("button", { name: "Share Photo" }));

    expect(await screen.findByRole("heading", { name: "Photo shared!" })).toBeInTheDocument();
    expect(uploadPhoto).toHaveBeenCalledWith(EVENT.id, expect.any(Blob), { anonymous: true });
    expect(screen.getByText(/shared anonymously/)).toBeInTheDocument();
  });

  it("a failed upload shows an error and 'Try Again', and Try Again shares the photo", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadPhoto).mockRejectedValueOnce(new Error("offline"));
    await openSharePage();

    await user.click(screen.getByRole("button", { name: "Share Photo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your photo didn't upload");

    await user.click(screen.getByRole("button", { name: "Try Again" }));
    expect(await screen.findByRole("heading", { name: "Photo shared!" })).toBeInTheDocument();
    expect(uploadPhoto).toHaveBeenCalledTimes(2);
  });

  it("without a photo, the share page sends the participant back to the camera", async () => {
    render(
      <EventSession eventId={EVENT.id}>
        <SharePage />
      </EventSession>
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(`/e/${EVENT.id}/camera`));
  });
});

describe("26.x - Copy Link", () => {
  const LINK = "https://eventgallery.com/e/test-event";

  function stubClipboard(writeText: ReturnType<typeof vi.fn> | undefined) {
    Object.defineProperty(navigator, "clipboard", {
      value: writeText ? { writeText } : undefined,
      configurable: true
    });
  }

  it("shows the link, then copies the exact link and shows 'Link copied!'", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<ShareLinkModal link={LINK} eventId="test-event" onClose={() => {}} />);
    expect(screen.getByText("eventgallery.com/e/test-event")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Copy Link/ }));

    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(await screen.findByRole("heading", { name: "Link copied!" })).toBeInTheDocument();
  });

  it("the QR code in the dialog holds the same link", () => {
    stubClipboard(undefined);
    render(<ShareLinkModal link={LINK} eventId="test-event" onClose={() => {}} />);
    expect(screen.getByRole("img", { name: `QR code for ${LINK}` })).toBeInTheDocument();
  });

  it("when copying fails, it says so and does not show 'Link copied!'", async () => {
    const user = userEvent.setup();
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<ShareLinkModal link={LINK} eventId="test-event" onClose={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Copy Link/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't copy automatically");
    expect(screen.queryByRole("heading", { name: "Link copied!" })).not.toBeInTheDocument();
  });

  it("each event copies its own link", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const { unmount } = render(<ShareLinkModal link={LINK} eventId="test-event" onClose={() => {}} />);
    await user.click(screen.getByRole("button", { name: /Copy Link/ }));
    unmount();

    render(<ShareLinkModal link="https://eventgallery.com/e/event-2" eventId="event-2" onClose={() => {}} />);
    await user.click(screen.getByRole("button", { name: /Copy Link/ }));

    expect(writeText).toHaveBeenNthCalledWith(1, LINK);
    expect(writeText).toHaveBeenNthCalledWith(2, "https://eventgallery.com/e/event-2");
  });
});
