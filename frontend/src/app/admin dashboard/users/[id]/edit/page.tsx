import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import UserForm from "@/components/admin/UserForm";
import { orgs } from "@/lib/data";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = orgs.find((o) => o.id === id);
  if (!org) notFound();

  return (
    <div className="page">
      <PageHeader title="Edit User" />
      <div className="body">
        <UserForm
          mode="edit"
          id={org.id}
          // Placeholder: map your real record's organizer/person fields here.
          defaultValues={{ organizer: org.name, person: "" }}
        />
      </div>
    </div>
  );
}
