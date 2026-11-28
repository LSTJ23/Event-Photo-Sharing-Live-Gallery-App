// @vitest-environment jsdom
// Plan tests 17.3 / 17.4 / 17.5 (EO removes a single photo) and
// 18.6 / 18.7 (EO removes multiple photos).
// Page under test: /events/<eventId>/gallery/manage (organizer), using a fake in-memory API.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Photo } from "@/lib/types";

// The page sits behind a sign-in check. Pretend an organizer is signed in.
vi.mock("@/components/useCurrentUser", () => ({
  useCurrentUser: () => ({
    status: "ready",
    user: { id: "eo-1", name: "Eli Organizer", email: "eo@example.com", role: "organizer", mustChangePassword: false }
  })
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/events/test-event/gallery/manage",
  useSearchParams: () => new URLSearchParams()
}));

const EVENT = { id: "test-event", name: "Test Event", date: "2026-10-14", location: "Manila", shareLinkActive: true };

// The fake "server": the photos the API currently holds.
let photoStore: Photo[] = [];
let failNextRemoval = false;

vi.mock("@/lib/api", () => ({
  getEvent: vi.fn(async () => EVENT),
  listPhotos: vi.fn(async () => [...photoStore]),
  removePhotos: vi.fn(async (_eventId: string, ids: string[]) => {
    if (failNextRemoval) {
      failNextRemoval = false;
      throw new Error("Removing photo failed with status 500");
    }
    photoStore = photoStore.filter((photo) => !ids.includes(photo.id));
  })
}));

import { EventSession } from "@/components/EventSession";
import { OrganizerStoreProvider } from "@/components/organizer/OrganizerStore";
import OrganizerGalleryPage from "@/app/(organizer)/events/[id]/gallery/page";
import ManageGalleryPage from "@/app/(organizer)/events/[id]/gallery/manage/page";
import { removePhotos } from "@/lib/api";

const makePhotos = (n: number): Photo[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    eventId: EVENT.id,
    url: `data:image/png;base64,${i}`,
    sharedBy: `Guest ${i + 1}`,
    createdAt: new Date(Date.UTC(2026, 9, 14, 12, i)).toISOString()
  }));

async function openManagePage(photoCount: number, single = false) {
  photoStore = makePhotos(photoCount);
  render(
    <OrganizerStoreProvider>
      <EventSession eventId={EVENT.id} variant="admin">
        {single ? <OrganizerGalleryPage /> : <ManageGalleryPage />}
      </EventSession>
    </OrganizerStoreProvider>
  );
  if (single) await screen.findByRole("button", { name: "Open photo shared by Guest 1" });
  else await screen.findByText(`${photoCount} photos`);
}

const openButton = (n: number) => screen.getByRole("button", { name: `Open photo shared by Guest ${n}` });
const selectButton = (n: number) => screen.getByRole("button", { name: `Select photo shared by Guest ${n}` });
async function askToRemove(user: ReturnType<typeof userEvent.setup>, n: number) {
  await user.click(openButton(n));
  await user.click(screen.getByRole("button", { name: "Delete" }));
}

beforeEach(() => {
  failNextRemoval = false;
  vi.mocked(removePhotos).mockClear();
});

describe("17.3 / 17.4 / 17.5 - EO removes a single photo", () => {
  it("every photo can be opened", async () => {
    await openManagePage(3, true);
    expect(screen.getAllByRole("button", { name: /^Open photo shared by/ })).toHaveLength(3);
  });

  it("asks for confirmation with the can't-be-undone warning", async () => {
    const user = userEvent.setup();
    await openManagePage(3, true);

    await askToRemove(user, 1);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Remove this photo?")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("It will be removed from the event gallery for everyone. This can't be undone.");
  });

  it("Cancel removes nothing and the count stays the same", async () => {
    const user = userEvent.setup();
    await openManagePage(3, true);

    await askToRemove(user, 1);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Remove this photo?")).not.toBeInTheDocument();
    expect(removePhotos).not.toHaveBeenCalled();
    expect(screen.getByText(/3 photos/)).toBeInTheDocument();
  });

  it("Remove deletes only that photo and the count goes down by one", async () => {
    const user = userEvent.setup();
    await openManagePage(3, true);

    await askToRemove(user, 2);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await screen.findByText(/2 photos/);
    expect(removePhotos).toHaveBeenCalledWith(EVENT.id, ["p2"]);
    expect(screen.queryByRole("button", { name: "Open photo shared by Guest 2" })).not.toBeInTheDocument();
    expect(openButton(1)).toBeInTheDocument();
    expect(openButton(3)).toBeInTheDocument();
    // 17.5: the "server" no longer returns it, so the participant gallery can't show it either.
    expect(photoStore.map((photo) => photo.id)).toEqual(["p1", "p3"]);
  });

  it("shows an error and 'Try Again' when removal fails, then succeeds on retry", async () => {
    const user = userEvent.setup();
    await openManagePage(3, true);
    failNextRemoval = true;

    await askToRemove(user, 1);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Couldn't remove the photo/);
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    expect(screen.getByText(/3 photos/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try Again" }));
    await screen.findByText(/2 photos/);
  });

  it("disables both buttons and shows 'Removing…' while the request is running", async () => {
    const user = userEvent.setup();
    await openManagePage(3, true);
    let finish!: () => void;
    vi.mocked(removePhotos).mockImplementationOnce(
      () => new Promise<void>((resolve) => (finish = resolve))
    );

    await askToRemove(user, 1);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.getByRole("button", { name: "Removing…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.queryByText("Remove this photo?")).not.toBeInTheDocument());
  });
});

describe("18.6 / 18.7 - EO removes multiple photos", () => {
  it("selecting photos shows 'Delete N Photos' and the selected count", async () => {
    const user = userEvent.setup();
    await openManagePage(6);
    expect(screen.queryByRole("button", { name: /^Delete \d/ })).not.toBeInTheDocument();

    await user.click(selectButton(1));
    expect(screen.getByRole("button", { name: "Delete 1" })).toBeInTheDocument();

    await user.click(selectButton(2));
    await user.click(selectButton(3));
    expect(screen.getByRole("button", { name: "Delete 3" })).toBeInTheDocument();
    expect(screen.getByText("3 selected")).toBeInTheDocument();
    expect(selectButton(1)).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking a selected photo again unselects it", async () => {
    const user = userEvent.setup();
    await openManagePage(6);

    await user.click(selectButton(1));
    await user.click(selectButton(1));

    expect(selectButton(1)).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: /^Delete \d/ })).not.toBeInTheDocument();
  });

  it("Clear unselects every photo and hides the Delete button", async () => {
    const user = userEvent.setup();
    await openManagePage(6);
    await user.click(selectButton(1));
    await user.click(selectButton(2));

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByRole("button", { name: /^Delete \d/ })).not.toBeInTheDocument();
    expect(selectButton(1)).toHaveAttribute("aria-pressed", "false");
    expect(selectButton(2)).toHaveAttribute("aria-pressed", "false");
  });

  it("Cancel keeps the 3 photos selected and removes nothing", async () => {
    const user = userEvent.setup();
    await openManagePage(6);
    for (const n of [1, 2, 3]) await user.click(selectButton(n));

    await user.click(screen.getByRole("button", { name: "Delete 3" }));
    expect(screen.getByText("Remove 3 photos?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(removePhotos).not.toHaveBeenCalled();
    expect(screen.getByText("6 photos")).toBeInTheDocument();
    for (const n of [1, 2, 3]) expect(selectButton(n)).toHaveAttribute("aria-pressed", "true");
  });

  it("Remove deletes only the 3 selected photos and the count goes down by 3", async () => {
    const user = userEvent.setup();
    await openManagePage(6);
    for (const n of [1, 2, 3]) await user.click(selectButton(n));

    await user.click(screen.getByRole("button", { name: "Delete 3" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await screen.findByText("3 photos");
    expect(removePhotos).toHaveBeenCalledWith(EVENT.id, ["p1", "p2", "p3"]);
    expect(photoStore.map((photo) => photo.id)).toEqual(["p4", "p5", "p6"]);
    // The selection is cleared once the photos are gone.
    expect(screen.queryByRole("button", { name: /^Delete \d/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select photo shared by Guest 1$/ })).not.toBeInTheDocument();
  });

  it("shows an error and 'Try Again' when the bulk removal fails", async () => {
    const user = userEvent.setup();
    await openManagePage(6);
    failNextRemoval = true;
    await user.click(selectButton(1));
    await user.click(selectButton(2));

    await user.click(screen.getByRole("button", { name: "Delete 2" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Couldn't remove the photos/);
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    expect(screen.getByText("6 photos")).toBeInTheDocument();
  });
});
