"use client";

import { useState } from "react";

type Props = {
  mode: "create" | "edit";
  id?: string;
  defaultValues?: { organizer: string; person: string };
};

export default function UserForm({ mode, id, defaultValues }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    // TODO: POST (create) or PUT/PATCH (edit) to your API
    console.log(mode === "edit" ? `edit user ${id}` : "create user", form);
    setMessage(
      mode === "edit"
        ? "Changes submitted (not saved yet — wire this to your API)."
        : "User submitted (not saved yet — wire this to your API)."
    );
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="organizer">Organizer Name</label>
        <input
          id="organizer"
          name="organizer"
          placeholder="Event1"
          defaultValue={defaultValues?.organizer}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="person">Person Name</label>
        <input
          id="person"
          name="person"
          placeholder="Event1"
          defaultValue={defaultValues?.person}
          required
        />
      </div>
      <button className="submit" type="submit" style={{ margin: "22px 0 0" }}>
        {mode === "edit" ? "Save" : "Submit"}
      </button>
      {message && (
        <p className="form-msg" style={{ textAlign: "left" }} role="status">
          {message}
        </p>
      )}
    </form>
  );
}
