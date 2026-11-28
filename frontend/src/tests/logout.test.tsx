// @vitest-environment jsdom
// 3.11 - Log out ends the session and returns to the portal (the login page).
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/auth", () => ({ signOut: vi.fn() }));

import LogoutPage from "@/app/logout/page";
import { signOut } from "@/lib/auth";

beforeEach(() => {
  vi.mocked(signOut).mockReset();
  router.replace.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("3.11 - logging out", () => {
  it("signs out and sends the user back to the login page", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined);
    render(<LogoutPage />);

    expect(screen.getByText("Logging out...")).toBeInTheDocument();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/portal"));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("if signing out fails, it says so and does not leave for the login page", async () => {
    vi.mocked(signOut).mockRejectedValue(new Error("offline"));
    render(<LogoutPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not log out.");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("'Try again' signs out a second time and then leaves for the login page", async () => {
    vi.mocked(signOut).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<LogoutPage />);

    await user.click(await screen.findByRole("button", { name: "Try again" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/portal"));
    expect(signOut).toHaveBeenCalledTimes(2);
  });
});
