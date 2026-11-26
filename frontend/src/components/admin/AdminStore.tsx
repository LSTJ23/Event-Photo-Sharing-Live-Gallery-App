"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  initialAdminEvents,
  initialAdminReports,
  initialOrganizers,
  type AdminEvent,
  type AdminReport,
  type EventForm,
  type Organizer,
  type UserForm
} from "@/lib/adminData";

// TODO (backend): these actions only change this in-memory copy. Each needs an
// API call, and the server must check the caller is an admin. Creating an
// event should also email the chosen organizer an invite to it.

interface AdminStore {
  events: AdminEvent[];
  organizers: Organizer[];
  reports: AdminReport[];
  toast: string;
  notify: (message: string) => void;
  getEvent: (id: string) => AdminEvent | undefined;
  getOrganizer: (id: string) => Organizer | undefined;
  createEvent: (form: EventForm) => void;
  updateEvent: (id: string, form: EventForm) => void;
  createOrganizer: (form: UserForm) => void;
  updateOrganizer: (id: string, form: UserForm) => void;
  resendInvite: (id: string) => void;
  /** Past events: tuck away, bring back, or delete for good. */
  archiveEvent: (id: string) => void;
  restoreEvent: (id: string) => void;
  deleteEvent: (id: string) => void;
}

const Context = createContext<AdminStore | null>(null);

export function useAdminStore(): AdminStore {
  const value = useContext(Context);
  if (!value) throw new Error("useAdminStore must be used inside <AdminStoreProvider>");
  return value;
}

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "event";

const fromForm = (form: EventForm) => ({
  name: form.name.trim(),
  venue: form.venue.trim(),
  organizerId: form.organizerId,
  hashtag: form.hashtag.trim().replace(/^#/, ""),
  capacity: Number(form.capacity),
  date: form.date,
  time: form.time,
  endDate: form.endDate,
  endTime: form.endTime
});

/** Keeps the admin dashboard's sample data in memory while you click around. */
export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState(initialAdminEvents);
  const [organizers, setOrganizers] = useState(initialOrganizers);
  const [reports, setReports] = useState(initialAdminReports);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  const value = useMemo<AdminStore>(() => {
    const getOrganizer = (id: string) => organizers.find((o) => o.id === id);
    return {
      events,
      organizers,
      reports,
      toast,
      notify,
      getEvent: (id) => events.find((e) => e.id === id),
      getOrganizer,

      createEvent: (form) => {
        let id = slug(form.name);
        while (events.some((e) => e.id === id)) id = `${slug(form.name)}-${Math.floor(Math.random() * 1000)}`;
        setEvents((all) => [...all, { id, ...fromForm(form), status: "UPCOMING", participants: 0, photoCount: 0, covers: [] }]);
        const org = getOrganizer(form.organizerId);
        notify(org ? `Event created. ${org.person} has been invited.` : "Event created");
      },
      updateEvent: (id, form) => {
        const before = events.find((e) => e.id === id);
        setEvents((all) => all.map((e) => (e.id === id ? { ...e, ...fromForm(form) } : e)));
        const org = getOrganizer(form.organizerId);
        notify(before && org && before.organizerId !== form.organizerId ? `Saved. ${org.person} has been invited.` : "Changes saved");
      },

      createOrganizer: (form) => {
        const organizer: Organizer = {
          id: `org-${Date.now()}`,
          org: form.org.trim(),
          person: form.person.trim(),
          email: form.email.trim(),
          status: "invited"
        };
        setOrganizers((all) => [...all, organizer]);
        notify(`${organizer.person} added. A login link was sent to ${organizer.email}.`);
      },
      updateOrganizer: (id, form) => {
        setOrganizers((all) =>
          all.map((o) => (o.id === id ? { ...o, org: form.org.trim(), person: form.person.trim(), email: form.email.trim() } : o))
        );
        notify("Changes saved");
      },
      resendInvite: (id) => {
        const o = getOrganizer(id);
        if (o) notify(`Invite sent again to ${o.email}`);
      },
      archiveEvent: (id) => {
        setEvents((all) => all.map((e) => (e.id === id ? { ...e, archived: true } : e)));
        notify("Event archived");
      },
      restoreEvent: (id) => {
        setEvents((all) => all.map((e) => (e.id === id ? { ...e, archived: false } : e)));
        notify("Event restored to Past events");
      },
      deleteEvent: (id) => {
        setEvents((all) => all.filter((e) => e.id !== id));
        setReports((all) => all.filter((r) => r.eventId !== id));
        notify("Event deleted");
      }
    };
  }, [events, organizers, reports, toast, notify]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
