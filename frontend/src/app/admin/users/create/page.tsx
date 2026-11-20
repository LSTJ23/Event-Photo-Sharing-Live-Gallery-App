"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/AdminShell";
import { useAdminStore } from "@/components/admin/AdminStore";
import { UserFormView } from "@/components/admin/UserFormView";
import styles from "@/components/admin/dashboard.module.css";

/** Add an event organizer. They get a login link by email. */
export default function CreateUserPage() {
  const router = useRouter();
  const { createOrganizer } = useAdminStore();
  return (
    <div className={styles.centered}>
      <PageHeader title="Create User" back="/admin" subtitle="Add an event organizer. You can then assign them to events." />
      <UserFormView
        initial={{ org: "", person: "", email: "" }}
        submitLabel="Create user"
        cancelHref="/admin"
        onSubmit={(form) => {
          createOrganizer(form);
          router.push("/admin/users");
        }}
      />
    </div>
  );
}
