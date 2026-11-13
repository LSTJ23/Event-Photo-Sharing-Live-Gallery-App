import ManageList from "@/components/admin/ManageList";
import PageHeader from "@/components/admin/PageHeader";
import { orgs } from "@/lib/data";

export default function ManageUsersPage() {
  const items = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    actions: [{ label: "Edit", href: `/admin%20dashboard/users/${o.id}/edit` }],
  }));

  return (
    <div className="page">
      <PageHeader title="Manage Users" />
      <div className="body">
        <ManageList items={items} addHref="/admin%20dashboard/users/create" emptyText="No organizations found" />
      </div>
    </div>
  );
}
