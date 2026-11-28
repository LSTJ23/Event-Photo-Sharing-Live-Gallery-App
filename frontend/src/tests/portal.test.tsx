// @vitest-environment jsdom
// The login portal (/portal):
//   3.1 / 3.2   organizer and admin log in and land on their own dashboard
//   3.3 / 3.4   wrong password and unknown email show the same error
//   3.5 / 3.6   empty fields and a badly formed email are not submitted
//   1.1 / 1.2   a participant joins an event from its link, or sees the error
//   password    first-login password change
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = { push: vi.fn(), replace: vi.fn() };
const page = vi.hoisted(() => ({
  search: new URLSearchParams(),
  signedIn: { status: "signedOut" } as { status: string; user?: unknown }
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => page.search
}));
vi.mock("@/components/useCurrentUser", () => ({ useCurrentUser: () => page.signedIn }));
vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  signIn: vi.fn(),
  joinEvent: vi.fn(),
  signOut: vi.fn(),
  changePassword: vi.fn()
}));

import AppPortal from "@/app/portal/page";
import { AuthRequestError, changePassword, joinEvent, signIn, signOut, type AuthUser } from "@/lib/auth";

const staff = (role: "organizer" | "admin", mustChangePassword = false): AuthUser => ({
  id: `${role}-1`, name: role, email: `${role}@example.com`, role, mustChangePassword
});

beforeEach(() => {
  vi.mocked(signIn).mockReset();
  vi.mocked(joinEvent).mockReset();
  vi.mocked(signOut).mockReset().mockResolvedValue(undefined);
  vi.mocked(changePassword).mockReset();
  router.push.mockClear();
  page.search = new URLSearchParams();
  page.signedIn = { status: "signedOut" };
});

/** Opens the "Organizer & Admin" form from the portal's home screen. */
async function openDashboardLogin() {
  const user = userEvent.setup();
  render(<AppPortal />);
  await user.click(screen.getByRole("button", { name: /Organizer & Admin/ }));
  return user;
}

async function fillDashboardLogin(user: ReturnType<typeof userEvent.setup>, email: string, password: string) {
  await user.type(screen.getByLabelText("Email Address"), email);
  await user.type(screen.getByLabelText("Password"), password);
}

const loginButton = () => screen.getByRole("button", { name: "Login to Dashboard" });

describe("3.1 / 3.2 - organizer and admin log in", () => {
  it("an organizer who logs in goes to the organizer dashboard (/events)", async () => {
    vi.mocked(signIn).mockResolvedValue(staff("organizer"));
    const user = await openDashboardLogin();

    await fillDashboardLogin(user, "eo@example.com", "correct-password");
    await user.click(loginButton());

    expect(signIn).toHaveBeenCalledWith("eo@example.com", "correct-password");
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/events"));
  });

  it("an admin who picks 'System Admin' and logs in goes to the admin dashboard (/admin)", async () => {
    vi.mocked(signIn).mockResolvedValue(staff("admin"));
    const user = await openDashboardLogin();

    await fillDashboardLogin(user, "admin@example.com", "correct-password");
    await user.selectOptions(screen.getByLabelText("Select Role"), "admin");
    await user.click(loginButton());

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/admin"));
  });

  it("the login button says 'Signing in...' and is disabled while waiting", async () => {
    let finish!: (value: AuthUser) => void;
    vi.mocked(signIn).mockReturnValue(new Promise<AuthUser>((resolve) => (finish = resolve)));
    const user = await openDashboardLogin();

    await fillDashboardLogin(user, "eo@example.com", "pw");
    await user.click(loginButton());

    expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();
    finish(staff("organizer"));
    await waitFor(() => expect(router.push).toHaveBeenCalled());
  });

  it("an account that does not match the chosen role is signed out and not let in", async () => {
    vi.mocked(signIn).mockResolvedValue(staff("organizer"));
    const user = await openDashboardLogin();

    await fillDashboardLogin(user, "eo@example.com", "correct-password");
    await user.selectOptions(screen.getByLabelText("Select Role"), "admin");
    await user.click(loginButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("This account does not match the selected role.");
    expect(signOut).toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("3.3 / 3.4 - failed logins show the same error", () => {
  it.each([
    ["a wrong password", "eo@example.com", "wrong-password"],
    ["an email with no account", "nobody@example.com", "anything"]
  ])("%s shows the generic error and stays on the login form", async (_case, email, password) => {
    vi.mocked(signIn).mockRejectedValue(new AuthRequestError(401, "Invalid email or password."));
    const user = await openDashboardLogin();

    await fillDashboardLogin(user, email, password);
    await user.click(loginButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(router.push).not.toHaveBeenCalled();
    expect(loginButton()).toBeEnabled();
  });

  it("the error message never says which of the two was wrong", async () => {
    vi.mocked(signIn).mockRejectedValue(new AuthRequestError(401, "Invalid email or password."));
    const user = await openDashboardLogin();
    await fillDashboardLogin(user, "eo@example.com", "wrong");
    await user.click(loginButton());

    const message = (await screen.findByRole("alert")).textContent ?? "";
    expect(message).not.toMatch(/no account|not registered|wrong password|incorrect password/i);
  });
});

describe("3.5 / 3.6 - empty and badly formed input is not submitted", () => {
  it("blank email and password do not send a login request", async () => {
    const user = await openDashboardLogin();
    await user.click(loginButton());

    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email Address")).toBeInvalid();
    expect(screen.getByLabelText("Password")).toBeInvalid();
  });

  it("an email without a domain, like 'admin@', does not send a login request", async () => {
    const user = await openDashboardLogin();
    await fillDashboardLogin(user, "admin@", "some-password");
    await user.click(loginButton());

    expect(screen.getByLabelText("Email Address")).toBeInvalid();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("a missing password alone does not send a login request", async () => {
    const user = await openDashboardLogin();
    await user.type(screen.getByLabelText("Email Address"), "eo@example.com");
    await user.click(loginButton());
    expect(signIn).not.toHaveBeenCalled();
  });
});

describe("first login - the password must be changed", () => {
  it("a new account is asked for a new password instead of opening the dashboard", async () => {
    vi.mocked(signIn).mockResolvedValue(staff("organizer", true));
    const user = await openDashboardLogin();

    await fillDashboardLogin(user, "eo@example.com", "temporary-password");
    await user.click(loginButton());

    expect(await screen.findByRole("heading", { name: "Change Password" })).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("saving a new password opens the dashboard", async () => {
    vi.mocked(signIn).mockResolvedValue(staff("organizer", true));
    vi.mocked(changePassword).mockResolvedValue(staff("organizer"));
    const user = await openDashboardLogin();
    await fillDashboardLogin(user, "eo@example.com", "temporary-password");
    await user.click(loginButton());

    await user.type(await screen.findByLabelText("New Password"), "a-new-password");
    await user.click(screen.getByRole("button", { name: "Save Password" }));

    expect(changePassword).toHaveBeenCalledWith("a-new-password");
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/events"));
  });

  it("a rejected new password shows the error and does not open the dashboard", async () => {
    vi.mocked(signIn).mockResolvedValue(staff("organizer", true));
    vi.mocked(changePassword).mockRejectedValue(new AuthRequestError(400, "The password was rejected. Choose a stronger password."));
    const user = await openDashboardLogin();
    await fillDashboardLogin(user, "eo@example.com", "temporary-password");
    await user.click(loginButton());

    await user.type(await screen.findByLabelText("New Password"), "password1");
    await user.click(screen.getByRole("button", { name: "Save Password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a stronger password");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("the new password field asks the browser to require at least 8 characters", async () => {
    vi.mocked(signIn).mockResolvedValue(staff("organizer", true));
    const user = await openDashboardLogin();
    await fillDashboardLogin(user, "eo@example.com", "temporary-password");
    await user.click(loginButton());

    // The browser itself enforces this rule (the simulated browser in these tests doesn't),
    // so the test checks the rule is set on the field. The server checks it too (backend tests).
    const field = await screen.findByLabelText("New Password");
    expect(field).toHaveAttribute("minlength", "8");
    expect(field).toBeRequired();
  });

  it("Log out on the password screen signs out and returns to the portal home", async () => {
    vi.mocked(signIn).mockResolvedValue(staff("organizer", true));
    const user = await openDashboardLogin();
    await fillDashboardLogin(user, "eo@example.com", "temporary-password");
    await user.click(loginButton());

    await user.click(await screen.findByRole("button", { name: "Log out" }));

    expect(signOut).toHaveBeenCalled();
    expect(await screen.findByRole("heading", { name: "Event Portal" })).toBeInTheDocument();
  });

  it("someone already signed in with a temporary password is sent straight to the password screen", () => {
    page.signedIn = { status: "ready", user: staff("organizer", true) };
    render(<AppPortal />);
    expect(screen.getByRole("heading", { name: "Change Password" })).toBeInTheDocument();
  });
});

describe("1.1 / 1.2 - a participant joins an event from its link", () => {
  beforeEach(() => {
    page.search = new URLSearchParams("event=test-event");
  });

  async function fillJoin(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("Full Name"), "Pat Guest");
    await user.type(screen.getByLabelText("Email Address"), "pat@example.com");
  }

  it("the event link opens the join form for that event", () => {
    render(<AppPortal />);
    expect(screen.getByRole("heading", { name: "Join Gallery" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter Event" })).toBeInTheDocument();
  });

  it("joining sends the name, email and event, then opens that event's terms", async () => {
    vi.mocked(joinEvent).mockResolvedValue({ ...staff("organizer"), role: "participant" } as AuthUser);
    const user = userEvent.setup();
    render(<AppPortal />);

    await fillJoin(user);
    await user.click(screen.getByRole("button", { name: "Enter Event" }));

    expect(joinEvent).toHaveBeenCalledWith("pat@example.com", "Pat Guest", "test-event");
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/e/test-event/terms"));
  });

  it("an event that does not exist, is inactive or has ended shows the error and stays on the form", async () => {
    vi.mocked(joinEvent).mockRejectedValue(new AuthRequestError(404, "This event link is unavailable."));
    const user = userEvent.setup();
    render(<AppPortal />);

    await fillJoin(user);
    await user.click(screen.getByRole("button", { name: "Enter Event" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This event link is unavailable.");
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Enter Event" })).toBeEnabled();
  });

  it.each([".", ".."])("the link %j is refused without asking the server", async (eventId) => {
    page.search = new URLSearchParams({ event: eventId });
    const user = userEvent.setup();
    render(<AppPortal />);

    await fillJoin(user);
    await user.click(screen.getByRole("button", { name: "Enter Event" }));

    expect(screen.getByRole("alert")).toHaveTextContent("This event link is invalid");
    expect(joinEvent).not.toHaveBeenCalled();
  });

  it("a blank name or email is not submitted", async () => {
    const user = userEvent.setup();
    render(<AppPortal />);
    await user.click(screen.getByRole("button", { name: "Enter Event" }));

    expect(joinEvent).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Full Name")).toBeInvalid();
    expect(screen.getByLabelText("Email Address")).toBeInvalid();
  });

  it("a badly formed email is not submitted", async () => {
    const user = userEvent.setup();
    render(<AppPortal />);
    await user.type(screen.getByLabelText("Full Name"), "Pat Guest");
    await user.type(screen.getByLabelText("Email Address"), "pat.example.com");
    await user.click(screen.getByRole("button", { name: "Enter Event" }));

    expect(screen.getByLabelText("Email Address")).toBeInvalid();
    expect(joinEvent).not.toHaveBeenCalled();
  });

  it("without an event link, the participant is told to scan the QR code and there is no join form", async () => {
    page.search = new URLSearchParams();
    const user = userEvent.setup();
    render(<AppPortal />);
    await user.click(screen.getByRole("button", { name: "Participant Access" }));

    expect(screen.getByText(/Open the event link or scan its QR code/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enter Event" })).not.toBeInTheDocument();
  });
});
