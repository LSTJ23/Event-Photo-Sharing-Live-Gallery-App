import PageHeader from "@/components/admin/PageHeader";
import UserForm from "@/components/admin/UserForm";

export default function CreateUserPage() {
  return (
    <div className="page">
      <PageHeader title="Create User" />
      <div className="body">
        <UserForm mode="create" />
      </div>
    </div>
  );
}
