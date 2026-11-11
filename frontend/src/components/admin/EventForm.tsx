"use client";

import { useState } from "react";
import Calendar, { type DateTimeValue } from "./Calendar";

const FIELDS = [
  { name: "name", label: "Event Name", placeholder: "Event1" },
  { name: "venue", label: "Event Venue", placeholder: "Venue1" },
  { name: "organizer", label: "Organizer", placeholder: "Organizer Name" },
  { name: "hashtag", label: "Event Hashtag", placeholder: "#event" },
  { name: "capacity", label: "Photo Capacity", placeholder: "200", type: "number" },
] as const;

export type EventFormValues = {
  name: string;
  venue: string;
  organizer: string;
  hashtag: string;
  capacity: string;
  startsAt?: string; // ISO string
};

type Props = {
  mode: "create" | "edit";
  id?: string;
  defaultValues?: Partial<EventFormValues>;
};

function toDateTime(iso?: string): DateTimeValue {
  const d = iso ? new Date(iso) : new Date();
  if (iso && !Number.isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return { date: d, time: `${hh}:${mm}` };
  }
  return { date: new Date(), time: "09:41" };
}

export default function EventForm({ mode, id, defaultValues }: Props) {
  const [when, setWhen] = useState<DateTimeValue>(() => toDateTime(defaultValues?.startsAt));
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const [h, m] = when.time.split(":").map(Number);
    const startsAt = new Date(when.date);
    startsAt.setHours(h || 0, m || 0, 0, 0);

    // TODO: POST (create) or PUT/PATCH (edit) to your API
    const payload = { ...form, startsAt: startsAt.toISOString() };
    console.log(mode === "edit" ? `edit event ${id}` : "create event", payload);
    setMessage(
      mode === "edit"
        ? "Changes submitted (not saved yet — wire this to your API)."
        : "Event submitted (not saved yet — wire this to your API)."
    );
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      <div className="create-event">
        <div>
          {FIELDS.map((f) => (
            <div className="field" key={f.name}>
              <label htmlFor={f.name}>{f.label}</label>
              <input
                id={f.name}
                name={f.name}
                type={"type" in f ? f.type : "text"}
                min={"type" in f ? 1 : undefined}
                placeholder={f.placeholder}
                defaultValue={defaultValues?.[f.name]}
                required
              />
            </div>
          ))}
        </div>

        <div className="cal-wrap">
          <h2>Event Date &amp; Time</h2>
          <Calendar value={when} onChange={setWhen} />
          <button className="submit" type="submit">
            {mode === "edit" ? "Save" : "Submit"}
          </button>
          {message && (
            <p className="form-msg" role="status">
              {message}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
