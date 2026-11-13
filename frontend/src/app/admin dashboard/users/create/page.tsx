import PageHeader from "@/components/PageHeader";
import UserForm from "@/components/UserForm";

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
