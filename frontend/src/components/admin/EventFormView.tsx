"use client";

import Link from "next/link";
import { useState } from "react";
import { eventFormErrors, formatWhen, type EventForm, type FormErrors } from "@/lib/adminData";
import { useAdminStore } from "./AdminStore";
import { Calendar } from "./Calendar";
import { TimeField } from "./TimeField";
import styles from "./dashboard.module.css";

export const emptyEventForm: EventForm = { name: "", venue: "", organizerId: "", hashtag: "", capacity: "200", date: "", time: "", endDate: "", endTime: "" };

/**
 * The event form used by Create Event and Edit Event: details on the left,
 * date and time on the right.
 */
export function EventFormView({
  initial,
  submitLabel,
  cancelHref,
  minCapacity = 1,
  onSubmit
}: {
  initial: EventForm;
  submitLabel: string;
  cancelHref: string;
  /** Photos already shared; the limit can't go below this. */
  minCapacity?: number;
  onSubmit: (form: EventForm) => void | Promise<void>;
}) {
  const { organizers, loading, loadError } = useAdminStore();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<FormErrors<EventForm>>({});
  const [tried, setTried] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const setMany = (change: Partial<EventForm>) => {
    const next = { ...form, ...change };
    setForm(next);
    if (tried) setErrors(eventFormErrors(next, minCapacity));
  };
  const set = (name: keyof EventForm, value: string) => setMany({ [name]: value });

  const text = (name: keyof EventForm, label: string, placeholder: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={`f-${name}`}>
        {label} <span className={styles.required} aria-hidden="true">*</span>
      </label>
      <input
        id={`f-${name}`}
        required
        className={styles.input}
        value={form[name]}
        placeholder={placeholder}
        aria-invalid={!!errors[name] || undefined}
        aria-describedby={errors[name] ? `e-${name}` : undefined}
        onChange={(e) => set(name, e.target.value)}
        {...extra}
      />
      {errors[name] && (
        <p id={`e-${name}`} className={styles.error}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form
      className={styles.card}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting || loading || loadError) return;
        const found = eventFormErrors(form, minCapacity);
        setErrors(found);
        setTried(true);
        if (Object.keys(found).length > 0) {
          document.getElementById(`f-${Object.keys(found)[0]}`)?.focus();
          return;
        }
        setSubmitting(true);
        setSubmitError("");
        try {
          await onSubmit(form);
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : "Could not save event.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className={styles.formLayout}>
        <div className={styles.fields}>
          {text("name", "Event name", "e.g. Org Week 2026")}
          {text("venue", "Event venue", "e.g. Henry Sy Hall, DLSU")}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="f-organizerId">
              Organizer <span className={styles.required} aria-hidden="true">*</span>
            </label>
            <select
              id="f-organizerId"
              className={styles.input}
              value={form.organizerId}
              aria-invalid={!!errors.organizerId || undefined}
              required
              aria-describedby={errors.organizerId ? "h-organizerId" : undefined}
              onChange={(e) => set("organizerId", e.target.value)}
            >
              <option value="">Choose an organizer</option>
              {organizers.filter((o) => o.status === "active").map((o) => (
                <option key={o.id} value={o.id}>
                  {o.org} ({o.person})
                </option>
              ))}
            </select>
            {errors.organizerId && (
              <p id="h-organizerId" className={styles.error}>
                {errors.organizerId}
              </p>
            )}
          </div>

          <div className={styles.twoCols}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="f-hashtag">
                Event hashtag <span className={styles.hint}>(optional)</span>
              </label>
              <div className={styles.prefixed}>
                <span aria-hidden="true">#</span>
                <input
                  id="f-hashtag"
                  className={styles.input}
                  value={form.hashtag.replace(/^#/, "")}
                  placeholder="OrgWeek2026"
                  aria-invalid={!!errors.hashtag || undefined}
                  onChange={(e) => set("hashtag", e.target.value)}
                />
              </div>
              {errors.hashtag && <p className={styles.error}>{errors.hashtag}</p>}
            </div>
            {text("capacity", "Photo capacity", "200", { inputMode: "numeric", type: "number", min: minCapacity, step: 1 })}
          </div>
        </div>

        <div className={styles.fields}>
          <span className={styles.label} id="date-label">
            When <span className={styles.required} aria-hidden="true">*</span>
          </span>
          <div>
            <Calendar
              start={form.date}
              end={form.endDate}
              onChange={(start, end) => setMany({ date: start, endDate: end })}
              invalid={!!(errors.date || errors.endDate)}
              labelledBy="date-label"
            />
            <div className={styles.whenRows}>
              <span className={styles.whenLabel} aria-hidden="true">
                Starts
              </span>
              <input
                id="f-date"
                type="date"
                className={styles.input}
                aria-label="Start date"
                value={form.date}
                required
                aria-invalid={!!errors.date || undefined}
                onChange={(e) => setMany({ date: e.target.value, endDate: !form.endDate || form.endDate < e.target.value ? e.target.value : form.endDate })}
              />
              <TimeField id="f-time" label="Start time" value={form.time} invalid={!!errors.time} onChange={(v) => set("time", v)} />
              <span className={styles.whenLabel} aria-hidden="true">
                Ends
              </span>
              <input
                id="f-endDate"
                type="date"
                className={styles.input}
                aria-label="End date"
                value={form.endDate}
                min={form.date || undefined}
                required
                aria-invalid={!!errors.endDate || undefined}
                onChange={(e) => set("endDate", e.target.value)}
              />
              <TimeField id="f-endTime" label="End time" value={form.endTime} invalid={!!errors.endTime} onChange={(v) => set("endTime", v)} />
            </div>
            {(errors.date || errors.time || errors.endDate || errors.endTime) && (
              <p className={styles.error}>{errors.date ?? errors.time ?? errors.endDate ?? errors.endTime}</p>
            )}
            {form.date && !errors.date && !errors.time && !errors.endDate && !errors.endTime && (
              <p className={styles.picked}>{formatWhen(form.date, form.time, form.endDate, form.endTime)}</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.formFoot}>
        {(submitError || loadError) && <p className={styles.error} role="alert">{submitError || loadError}</p>}
        <Link href={cancelHref} className={styles.btn}>
          Cancel
        </Link>
        <button type="submit" className={styles.btnDark} disabled={loading || !!loadError || submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
