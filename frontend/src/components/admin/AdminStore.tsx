"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import * as adminApi from "@/lib/adminApi";

// Organizer management and reports still use sample/in-memory data.

interface AdminStore {
  events: AdminEvent[];
  organizers: Organizer[];
  reports: AdminReport[];
  toast: string;
  loading: boolean;
  loadError: string;
  notify: (message: string) => void;
  getEvent: (id: string) => AdminEvent | undefined;
  getOrganizer: (id: string) => Organizer | undefined;
  createEvent: (form: EventForm) => Promise<void>;
  updateEvent: (id: string, form: EventForm) => Promise<void>;
  createOrganizer: (form: UserForm) => void;
  updateOrganizer: (id: string, form: UserForm) => void;
  resendInvite: (id: string) => void;
  /** Past events: tuck away, bring back, or delete for good. */
  archiveEvent: (id: string) => void;
  restoreEvent: (id: string) => void;
  deleteEvent: (id: string) => Promise<void>;
  /** After an admin deletes a reported photo: its reports are marked Removed. */
  photoRemoved: (eventId: string, photoId: string) => void;
  /** An admin keeps a reported photo: the report is closed. */
  keepReport: (reportId: number) => void;
}

const Context = createContext<AdminStore | null>(null);

export function useAdminStore(): AdminStore {
  const value = useContext(Context);
  if (!value) throw new Error("useAdminStore must be used inside <AdminStoreProvider>");
  return value;
}

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const mockMode = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
  const [events, setEvents] = useState<AdminEvent[]>(mockMode ? initialAdminEvents : []);
  const [organizers, setOrganizers] = useState<Organizer[]>(mockMode ? initialOrganizers : []);
  const [reports, setReports] = useState(initialAdminReports);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(!mockMode);
  const [loadError, setLoadError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => {
    if (mockMode) return;
    let active = true;
    Promise.all([adminApi.listEvents(), adminApi.listOrganizers()])
      .then(([loadedEvents, loadedOrganizers]) => {
        if (!active) return;
        setEvents(loadedEvents);
        setOrganizers(loadedOrganizers);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load admin data.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mockMode]);

  const value = useMemo<AdminStore>(() => {
    const getOrganizer = (id: string) => organizers.find((o) => o.id === id);
    return {
      events,
      organizers,
      reports,
      toast,
      loading,
      loadError,
      notify,
      getEvent: (id) => events.find((e) => e.id === id),
      getOrganizer,

      createEvent: async (form) => {
        if (mockMode) throw new Error("Event creation requires the real API. Disable mock mode.");
        const event = await adminApi.createEvent(form);
        setEvents((all) => [...all, event]);
        notify("Event created. Email invitations are not yet available.");
      },
      updateEvent: async (id, form) => {
        if (mockMode) {
          setEvents((all) => all.map((event) => event.id === id ? {
            ...event, ...form, name: form.name.trim(), venue: form.venue.trim(),
            hashtag: form.hashtag.trim().replace(/^#/, ""), capacity: Number(form.capacity)
          } : event));
          notify("Demo changes saved in memory only.");
          return;
        }
        throw new Error("Editing saved events is not available yet.");
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
        if (mockMode) {
          setEvents((all) => all.map((event) => event.id === id ? { ...event, archived: true } : event));
          notify("Demo event archived in memory only.");
          return;
        }
        notify("Archiving saved events is not available yet.");
      },
      restoreEvent: (id) => {
        if (mockMode) {
          setEvents((all) => all.map((event) => event.id === id ? { ...event, archived: false } : event));
          notify("Demo event restored in memory only.");
          return;
        }
        notify("Restoring saved events is not available yet.");
      },
      deleteEvent: async (id) => {
        if (mockMode) {
          setEvents((all) => all.filter((event) => event.id !== id));
          setReports((all) => all.filter((report) => report.eventId !== id));
          notify("Demo event deleted in memory only.");
          return;
        }
        notify("Deleting saved events is not available yet.");
      },
      keepReport: (reportId) => {
        setReports((all) => all.map((r) => (r.id === reportId ? { ...r, state: "kept", decidedByAdmin: true, decidedAt: "Just now" } : r)));
        notify("Photo kept");
      },
      photoRemoved: (eventId, photoId) => {
        setReports((all) =>
          all.map((r) => (r.eventId === eventId && r.photoId === photoId ? { ...r, state: "removed", removedByAdmin: true, decidedAt: "Just now" } : r))
        );
        notify("Photo deleted");
      }
    };
  }, [events, organizers, reports, toast, notify, loading, loadError, mockMode]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
