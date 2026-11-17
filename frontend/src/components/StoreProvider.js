"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { initialEvents, initialReports } from "@/lib/data";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export default function StoreProvider({ children }) {
  const [events, setEvents] = useState(initialEvents);
  const [reports, setReports] = useState(initialReports);
  const [toast, setToast] = useState("");
  const timer = useRef();

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  const value = useMemo(() => ({
    events, reports, toast, notify,
    getEvent: (id) => events.find((e) => e.id === Number(id)),
    getReport: (id) => reports.find((r) => r.id === Number(id)),
    pendingCount: (evId) => reports.filter((r) => r.state === "open" && (!evId || r.ev === evId)).length,
    unreadCount: reports.filter((r) => r.unread && r.state === "open").length,
    markRead: (id) => setReports((rs) => rs.map((r) => (r.id === Number(id) && r.unread ? { ...r, unread: false } : r))),
    deletePhoto: (evId, photoId) => {
      setEvents((es) => es.map((e) => (e.id === evId ? { ...e, photos: e.photos.filter((p) => p.id !== photoId) } : e)));
      setReports((rs) => rs.map((r) => (r.ev === evId && r.photo === photoId ? { ...r, state: "resolved" } : r)));
      notify("Photo deleted");
    },
    keepReport: (id) => {
      setReports((rs) => rs.map((r) => (r.id === id ? { ...r, state: "resolved" } : r)));
      notify("Photo kept");
    },
    setCapacity: (evId, capacity) => {
      setEvents((es) => es.map((e) => (e.id === evId ? { ...e, capacity } : e)));
      notify("Limit saved");
    },
  }), [events, reports, toast, notify]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
