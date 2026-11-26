"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/AdminShell";
import { useBackTo } from "@/components/admin/useBackTo";
import { useAdminStore } from "@/components/admin/AdminStore";
import { UserFormView } from "@/components/admin/UserFormView";
import styles from "@/components/admin/dashboard.module.css";

/** Edit an organizer's details. */
export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getOrganizer, updateOrganizer } = useAdminStore();
  const org = getOrganizer(id);
  const back = useBackTo("/admin/users");

  if (!org) {
    return (
      <>
        <PageHeader title="User not found" back={back} subtitle="The account may have been deleted, or the link is wrong." />
        <Link href={back} className={styles.btn} style={{ alignSelf: "flex-start" }}>
          Go back
        </Link>
      </>
    );
  }

  return (
    <div className={styles.centered}>
      <PageHeader title="Edit User" back={back} subtitle={org.org} />
      <UserFormView
        initial={{ org: org.org, person: org.person, email: org.email }}
        editingId={org.id}
        submitLabel="Save changes"
        cancelHref={back}
        onSubmit={(form) => {
          updateOrganizer(org.id, form);
          router.push(back);
        }}
      />
    </div>
  );
}
