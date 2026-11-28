import { getSupabase } from "./supabase";
import type { EventInfo } from "./types";

export type Role = "participant" | "organizer" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

interface LoginResult {
  user: AuthUser;
  session: { accessToken: string; refreshToken: string };
}

export class AuthRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/auth${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store"
  });
  const data = await response.json();
  if (!response.ok) throw new AuthRequestError(response.status, data.error || "Authentication failed.");
  return data as T;
}

async function saveSession(result: LoginResult): Promise<AuthUser> {
  const { error } = await getSupabase().auth.setSession({
    access_token: result.session.accessToken,
    refresh_token: result.session.refreshToken
  });
  if (error) throw error;
  return result.user;
}

export async function joinEvent(email: string, name: string, eventId: string): Promise<AuthUser> {
  return saveSession(await request<LoginResult>("/join", {
    method: "POST", body: JSON.stringify({ email, name, eventId })
  }));
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  return saveSession(await request<LoginResult>("/login", {
    method: "POST", body: JSON.stringify({ email, password })
  }));
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function currentUser(token: string, eventId?: string): Promise<AuthUser> {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
  const result = await request<{ user: AuthUser }>(`/me${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return result.user;
}

export async function changePassword(password: string): Promise<AuthUser> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  if (!data.session) throw new AuthRequestError(401, "Please sign in again.");
  const result = await request<{ user: AuthUser }>("/password", {
    method: "POST",
    headers: { Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ password })
  });
  return result.user;
}

export async function getParticipantEvent(eventId: string): Promise<EventInfo> {
  return request<EventInfo>(`/events/${encodeURIComponent(eventId)}`);
}
