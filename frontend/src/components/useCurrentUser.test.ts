import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/lib/auth";

const mocks = vi.hoisted(() => ({
  useState: vi.fn(),
  useEffect: vi.fn(),
  currentUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  setSnapshot: vi.fn(),
  unsubscribe: vi.fn()
}));

vi.mock("react", () => ({ useState: mocks.useState, useEffect: mocks.useEffect }));
vi.mock("@/lib/auth", () => ({
  currentUser: mocks.currentUser,
  AuthRequestError: class extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  }
}));
vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ auth: { onAuthStateChange: mocks.onAuthStateChange } })
}));

import { AuthRequestError } from "@/lib/auth";
import { useCurrentUser } from "./useCurrentUser";

type Session = { access_token: string; user: { id: string } };
const user: AuthUser = {
  id: "staff-1", name: "Staff", email: "staff@example.com", role: "admin", mustChangePassword: false
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe("session revalidation", () => {
  let emit: (event: string, session: Session | null) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useState.mockImplementation((initial: unknown) => [initial, mocks.setSnapshot]);
    mocks.useEffect.mockImplementation((effect: () => void) => effect());
    mocks.onAuthStateChange.mockImplementation((callback: typeof emit) => {
      emit = callback;
      return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
    });
    mocks.currentUser.mockResolvedValue(user);
    useCurrentUser("event-1");
  });

  async function establishSession() {
    emit("INITIAL_SESSION", { access_token: "token", user: { id: user.id } });
    await vi.waitFor(() => {
      expect(mocks.setSnapshot).toHaveBeenLastCalledWith({
        eventId: "event-1", state: { status: "ready", user }
      });
    });
    mocks.setSnapshot.mockClear();
  }

  it("keeps a verified user visible during a same-user recheck and blocks a rejected session", async () => {
    await establishSession();
    const request = deferred<AuthUser>();
    mocks.currentUser.mockReturnValueOnce(request.promise);

    emit("SIGNED_IN", { access_token: "token", user: { id: user.id } });
    expect(mocks.currentUser).toHaveBeenLastCalledWith("token", "event-1");
    expect(mocks.setSnapshot).not.toHaveBeenCalled();

    request.reject(new AuthRequestError(401, "Session expired"));
    await vi.waitFor(() => {
      expect(mocks.setSnapshot).toHaveBeenLastCalledWith({
        eventId: "event-1", state: { status: "signedOut" }
      });
    });
  });

  it("blocks a different user until verified and ignores stale results after sign-out", async () => {
    await establishSession();
    const request = deferred<AuthUser>();
    mocks.currentUser.mockReturnValueOnce(request.promise);

    emit("SIGNED_IN", { access_token: "other-token", user: { id: "staff-2" } });
    expect(mocks.setSnapshot).toHaveBeenLastCalledWith({
      eventId: "event-1", state: { status: "loading" }
    });
    emit("SIGNED_OUT", null);
    request.resolve({ ...user, id: "staff-2" });
    await request.promise;
    await Promise.resolve();
    expect(mocks.setSnapshot).toHaveBeenLastCalledWith({
      eventId: "event-1", state: { status: "signedOut" }
    });
  });

  it("shows a connection error if a background recheck fails", async () => {
    await establishSession();
    mocks.currentUser.mockRejectedValueOnce(new Error("Network unavailable"));

    emit("TOKEN_REFRESHED", { access_token: "new-token", user: { id: user.id } });
    await vi.waitFor(() => {
      expect(mocks.setSnapshot).toHaveBeenLastCalledWith({
        eventId: "event-1", state: { status: "error" }
      });
    });
  });
});
