import type { Request, Response } from "express";

export type Role = "admin" | "organizer" | "participant";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: AuthUser;
  session: AuthSession;
}

export interface PublicEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  shareLinkActive: boolean;
}

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface AuthService {
  joinEvent(email: string, name: string, eventId: string): Promise<LoginResult>;
  signIn(email: string, password: string): Promise<LoginResult>;
  currentUser(token: string, eventId?: string): Promise<AuthUser>;
  changePassword(token: string, password: string): Promise<AuthUser>;
  event(eventId: string): Promise<PublicEvent>;
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 320) {
    throw new AuthError(400, "Invalid or missing fields.");
  }
  return value.trim();
}

function passwordString(value: unknown): string {
  if (typeof value !== "string" || !value || value.length > 1024) {
    throw new AuthError(400, "Invalid or missing fields.");
  }
  return value;
}

function emailString(value: unknown): string {
  const email = requiredString(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError(400, "Enter a valid email address.");
  }
  return email;
}

function tokenFrom(request: Request): string {
  const authorization = request.get("authorization");
  if (!authorization?.startsWith("Bearer ") || !authorization.slice(7).trim()) {
    throw new AuthError(401, "Please sign in.");
  }
  return authorization.slice(7).trim();
}

function handler(fn: (request: Request, response: Response) => Promise<void>) {
  return async (request: Request, response: Response) => {
    response.set("Cache-Control", "no-store");
    try {
      await fn(request, response);
    } catch (error) {
      if (error instanceof AuthError) {
        response.status(error.status).json({ error: error.message });
      } else {
        console.error("Authentication request failed:", error);
        response.status(500).json({ error: "Authentication is temporarily unavailable." });
      }
    }
  };
}

export function createAuthHandlers(auth: AuthService) {
  return {
    joinEvent: handler(async (req, res) => {
      const email = emailString(req.body?.email);
      const name = requiredString(req.body?.name);
      const eventId = requiredString(req.body?.eventId);
      res.json(await auth.joinEvent(email, name, eventId));
    }),
    login: handler(async (req, res) => {
      const email = requiredString(req.body?.email).toLowerCase();
      const password = passwordString(req.body?.password);
      res.json(await auth.signIn(email, password));
    }),
    me: handler(async (req, res) => {
      const eventId = req.query.eventId === undefined ? undefined : requiredString(req.query.eventId);
      res.json({ user: await auth.currentUser(tokenFrom(req), eventId) });
    }),
    changePassword: handler(async (req, res) => {
      const password = passwordString(req.body?.password);
      if (password.length < 8) throw new AuthError(400, "Password must be at least 8 characters.");
      res.json({ user: await auth.changePassword(tokenFrom(req), password) });
    }),
    event: handler(async (req, res) => {
      res.json(await auth.event(requiredString(req.params.eventId)));
    }),
  };
}
