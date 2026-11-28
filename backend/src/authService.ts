import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import { AuthError, type AuthService, type AuthUser, type LoginResult } from "./controllers/authController.js";

function participantDetails(value: unknown): { name: string; email: string } {
  if (typeof value !== "object" || value === null ||
      !("name" in value) || typeof value.name !== "string" ||
      !("email" in value) || typeof value.email !== "string") {
    throw new Error("Invalid participant attendance returned by the database.");
  }
  return { name: value.name, email: value.email };
}

export function createSupabaseAuthService(
  admin: SupabaseClient,
  env: NodeJS.ProcessEnv = process.env,
  createAuthClient?: () => SupabaseClient
): AuthService {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in the backend environment.");
  }

  const authClient = createAuthClient ?? (() => createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  }));

  async function findEvent(slug: string) {
    const { data, error } = await admin.from("events")
      .select("id,share_slug,name,start_at,location,share_link_active")
      .eq("share_slug", slug)
      .eq("share_link_active", true)
      .is("archived_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AuthError(404, "This event link is unavailable.");
    return data;
  }

  async function findStaff(id: string) {
    const { data, error } = await admin.from("staff_users")
      .select("id,email,full_name,role,is_active,must_change_password")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function verifiedUser(token: string): Promise<User> {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user || (!data.user.is_anonymous && (!data.user.email_confirmed_at || !data.user.email))) {
      if (error && (!error.status || error.status >= 500)) throw error;
      throw new AuthError(401, "Session expired. Please sign in again.");
    }
    return data.user;
  }

  async function requirePasswordLogin(token: string) {
    const { data, error } = await admin.auth.getClaims(token);
    if (error && (!error.status || error.status >= 500)) throw error;
    const amr = data?.claims.amr;
    if (!Array.isArray(amr) ||
        !amr.some((entry: unknown) =>
          typeof entry === "object" && entry !== null && "method" in entry && entry.method === "password")) {
      throw new AuthError(403, "Staff must use dashboard login.");
    }
  }

  function staffUser(staff: { id: string; email: string; full_name: string; role: string; is_active: boolean; must_change_password: boolean }): AuthUser {
    if (!staff.is_active) throw new AuthError(403, "This account is inactive.");
    if (staff.role !== "admin" && staff.role !== "organizer") throw new Error("Unexpected staff role.");
    return {
      id: staff.id, email: staff.email, name: staff.full_name,
      role: staff.role, mustChangePassword: staff.must_change_password
    };
  }

  function result(user: AuthUser, session: Session): LoginResult {
    return { user, session: { accessToken: session.access_token, refreshToken: session.refresh_token } };
  }

  return {
    async joinEvent(email, name, eventId) {
      const event = await findEvent(eventId);
      const { data, error } = await authClient().auth.signInAnonymously();
      if (error) {
        if (error.status === 429) throw new AuthError(429, "Too many requests. Please try again later.");
        throw error;
      }
      if (!data.session || !data.user || !data.user.is_anonymous) {
        throw new Error("Anonymous sign-in did not return a guest session.");
      }
      try {
        const { data: participant, error: membershipError } = await admin.rpc("join_event_guest", {
          p_event_id: event.id, p_auth_user_id: data.user.id, p_email: email, p_name: name
        }).single();
        if (membershipError) throw membershipError;
        const details = participantDetails(participant);
        return result({
          id: data.user.id, name: details.name, email: details.email,
          role: "participant", mustChangePassword: false
        }, data.session);
      } catch (joinError) {
        try {
          const { error: cleanupError } = await admin.auth.admin.deleteUser(data.user.id);
          if (cleanupError) console.error("Could not remove failed guest account:", cleanupError);
        } catch (cleanupError) {
          console.error("Could not remove failed guest account:", cleanupError);
        }
        throw joinError;
      }
    },
    async signIn(email, password) {
      const { data, error } = await authClient().auth.signInWithPassword({ email, password });
      if (error || !data.session || !data.user || data.user.is_anonymous || !data.user.email_confirmed_at) {
        if (error?.status === 429) throw new AuthError(429, "Too many attempts. Please try again later.");
        if (error && (!error.status || error.status >= 500)) throw error;
        throw new AuthError(401, "Invalid email or password.");
      }
      const staff = await findStaff(data.user.id);
      if (!staff) throw new AuthError(403, "This account does not have staff access.");
      return result(staffUser(staff), data.session);
    },
    async currentUser(token, eventId) {
      const user = await verifiedUser(token);
      const staff = user.is_anonymous ? null : await findStaff(user.id);
      if (staff) {
        await requirePasswordLogin(token);
        return staffUser(staff);
      }
      if (!eventId) throw new AuthError(403, "An event is required.");
      const event = await findEvent(eventId);
      if (user.is_anonymous) {
        const { data, error } = await admin.from("participant_sessions")
          .select("participants(name,email)")
          .eq("event_id", event.id)
          .eq("auth_user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!data?.participants) throw new AuthError(403, "Join this event first.");
        const details = participantDetails(data.participants);
        return { id: user.id, ...details, role: "participant", mustChangePassword: false };
      }
      const { data, error } = await admin.from("participants")
        .select("name")
        .eq("event_id", event.id)
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new AuthError(403, "Join this event first.");
      return { id: user.id, name: data.name as string, email: user.email!, role: "participant", mustChangePassword: false };
    },
    async changePassword(token, password) {
      const user = await verifiedUser(token);
      if (user.is_anonymous) throw new AuthError(403, "This account does not have staff access.");
      const staff = await findStaff(user.id);
      if (!staff) throw new AuthError(403, "This account does not have staff access.");
      await requirePasswordLogin(token);
      staffUser(staff);
      if (!staff.must_change_password) throw new AuthError(403, "A password change is not required.");
      const { error: passwordError } = await admin.auth.admin.updateUserById(user.id, { password });
      if (passwordError) {
        if (passwordError.status && passwordError.status < 500) throw new AuthError(400, "The password was rejected. Choose a stronger password.");
        throw passwordError;
      }
      const { data, error } = await admin.from("staff_users").update({ must_change_password: false })
        .eq("id", user.id).eq("is_active", true)
        .select("id,email,full_name,role,is_active,must_change_password").single();
      if (error) throw error;
      return staffUser(data);
    },
    async event(eventId) {
      const event = await findEvent(eventId);
      return {
        id: event.share_slug as string,
        name: event.name as string,
        date: (event.start_at as string).slice(0, 10),
        location: event.location as string,
        shareLinkActive: event.share_link_active as boolean
      };
    }
  };
}
