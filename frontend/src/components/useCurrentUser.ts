"use client";

import { useEffect, useState } from "react";
import { AuthRequestError, currentUser, type AuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export type UserState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "error" }
  | { status: "ready"; user: AuthUser };

export function useCurrentUser(eventId?: string): UserState {
  const [snapshot, setSnapshot] = useState<{ eventId?: string; state: UserState }>({
    eventId, state: { status: "loading" }
  });

  useEffect(() => {
    let active = true;
    let sequence = 0;
    const setState = (state: UserState) => setSnapshot({ eventId, state });
    const load = async (token: string | undefined) => {
      const current = ++sequence;
      if (!token) {
        if (active) setState({ status: "signedOut" });
        return;
      }
      if (active) setState({ status: "loading" });
      try {
        const user = await currentUser(token, eventId);
        if (active && current === sequence) setState({ status: "ready", user });
      } catch (error) {
        if (active && current === sequence) {
          setState(error instanceof AuthRequestError && (error.status === 401 || error.status === 403)
            ? { status: "signedOut" } : { status: "error" });
        }
      }
    };
    let subscription: { unsubscribe: () => void };
    try {
      subscription = getSupabase().auth.onAuthStateChange((_event, session) => {
        void load(session?.access_token);
      }).data.subscription;
    } catch (error) {
      console.error("Could not initialize authentication:", error);
      queueMicrotask(() => { if (active) setState({ status: "error" }); });
      return () => { active = false; };
    }
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [eventId]);

  return snapshot.eventId === eventId ? snapshot.state : { status: "loading" };
}
