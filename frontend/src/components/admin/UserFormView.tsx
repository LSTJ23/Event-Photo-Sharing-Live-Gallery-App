"use client";

import Link from "next/link";
import { useState } from "react";
import { userFormErrors, type FormErrors, type UserForm } from "@/lib/adminData";
import { useAdminStore } from "./AdminStore";
import styles from "./dashboard.module.css";

/** The organizer form used by Create User and Edit User. */
export function UserFormView({
  initial,
  editingId,
  submitLabel,
  cancelHref = "/admin/users",
  onSubmit
}: {
  initial: UserForm;
  /** The organizer being edited, so their own email isn't counted as taken. */
  editingId?: string;
  submitLabel: string;
  cancelHref?: string;
  onSubmit: (form: UserForm) => void;
}) {
  const { organizers } = useAdminStore();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<FormErrors<UserForm>>({});
  const [tried, setTried] = useState(false);

  const field = (name: keyof UserForm, label: string, placeholder: string, type = "text") => (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={`u-${name}`}>
        {label} <span className={styles.required} aria-hidden="true">*</span>
      </label>
      <input
        id={`u-${name}`}
        type={type}
        className={styles.input}
        value={form[name]}
        placeholder={placeholder}
        autoComplete="off"
        required
        aria-invalid={!!errors[name] || undefined}
        aria-describedby={errors[name] ? `uh-${name}` : undefined}
        onChange={(e) => {
          const next = { ...form, [name]: e.target.value };
          setForm(next);
          if (tried) setErrors(userFormErrors(next, organizers, editingId));
        }}
      />
      {errors[name] && (
        <p id={`uh-${name}`} className={styles.error}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form
      className={styles.card}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const found = userFormErrors(form, organizers, editingId);
        setErrors(found);
        setTried(true);
        if (Object.keys(found).length === 0) onSubmit(form);
        else document.getElementById(`u-${Object.keys(found)[0]}`)?.focus();
      }}
    >
      <div className={styles.fields}>
        {field("org", "Organizer name", "e.g. DLSU CSO")}
        {field("person", "Person name", "e.g. Maria Santos")}
        {field("email", "Email", "name@organization.com", "email")}
      </div>
      <div className={styles.formFoot}>
        <Link href={cancelHref} className={styles.btn}>
          Cancel
        </Link>
        <button type="submit" className={styles.btnDark}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
