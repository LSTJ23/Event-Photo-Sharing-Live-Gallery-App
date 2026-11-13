import ManageList from "@/components/ManageList";
import PageHeader from "@/components/PageHeader";
import { orgs } from "@/lib/data";

export default function ManageUsersPage() {
  const items = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    actions: [{ label: "Edit", href: `/users/${o.id}/edit` }],
  }));

  return (
    <div className="page">
      <PageHeader title="Manage Users" />
      <div className="body">
        <ManageList items={items} addHref="/users/create" emptyText="No organizations found" />
      </div>
    </div>
  );
}
