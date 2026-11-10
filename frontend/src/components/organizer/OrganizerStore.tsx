"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  initialEvents,
  initialReports,
  type OrganizerEvent,
  type PhotoReport
} from "@/lib/organizerData";

interface OrganizerStore {
  events: OrganizerEvent[];
  reports: PhotoReport[];
  toast: string;
  notify: (message: string) => void;
  getEvent: (id: string) => OrganizerEvent | undefined;
  getReport: (id: string) => PhotoReport | undefined;
  /** Open reports, for one event or all of them. */
  pendingCount: (eventId?: string) => number;
  unreadCount: number;
  markRead: (reportId: number) => void;
  deletePhoto: (eventId: string, photoId: number) => void;
  keepReport: (reportId: number) => void;
  setCapacity: (eventId: string, capacity: number) => void;
}

const Context = createContext<OrganizerStore | null>(null);

export function useOrganizerStore(): OrganizerStore {
  const value = useContext(Context);
  if (!value) throw new Error("useOrganizerStore must be used inside <OrganizerStoreProvider>");
  return value;
}

/** Keeps the dashboard's sample events and reports in memory while you click around. */
export function OrganizerStoreProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState(initialEvents);
  const [reports, setReports] = useState(initialReports);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  const markRead = useCallback(
    (reportId: number) =>
      setReports((all) => all.map((r) => (r.id === reportId && r.unread ? { ...r, unread: false } : r))),
    []
  );

  const value = useMemo<OrganizerStore>(
    () => ({
      events,
      reports,
      toast,
      notify,
      getEvent: (id) => events.find((e) => e.id === id),
      getReport: (id) => reports.find((r) => r.id === Number(id)),
      pendingCount: (eventId) => reports.filter((r) => r.state === "open" && (!eventId || r.eventId === eventId)).length,
      unreadCount: reports.filter((r) => r.unread && r.state === "open").length,
      markRead,
      deletePhoto: (eventId, photoId) => {
        setEvents((all) =>
          all.map((e) => (e.id === eventId ? { ...e, photos: e.photos.filter((p) => p.id !== photoId) } : e))
        );
        setReports((all) =>
          all.map((r) => (r.eventId === eventId && r.photoId === photoId ? { ...r, state: "resolved" } : r))
        );
        notify("Photo deleted");
      },
      keepReport: (reportId) => {
        setReports((all) => all.map((r) => (r.id === reportId ? { ...r, state: "resolved", unread: false } : r)));
        notify("Photo kept");
      },
      setCapacity: (eventId, capacity) => {
        setEvents((all) => all.map((e) => (e.id === eventId ? { ...e, capacity } : e)));
        notify("Limit saved");
      }
    }),
    [events, reports, toast, notify, markRead]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
