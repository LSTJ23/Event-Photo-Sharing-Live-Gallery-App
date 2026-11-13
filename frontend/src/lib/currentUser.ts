// Who is signed in. The login page (built separately) is the source of this.
//
// For the login developer: once someone signs in, make getCurrentUser()
// return their real details.
// - `name` is used for "Shared by <name>" in the gallery, unless a participant
//   chooses to share anonymously.
// - `role` decides who may open the organizer pages (/events, /reports and
//   /admin/…). Only "organizer" can. The backend must check this too: hiding a
//   page in the browser doesn't stop someone calling the API directly.
// Until login exists, everyone is the placeholder below, set as an organizer
// so all the pages can be tried out.
export type Role = "participant" | "organizer";

export interface CurrentUser {
  name: string;
  role: Role;
}

export function getCurrentUser(): CurrentUser {
  return { name: "Test User", role: "organizer" };
}
