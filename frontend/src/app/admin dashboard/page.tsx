import Link from "next/link";
import { PlusCircleIcon, StarIcon, UsersIcon } from "@/components/admin/Icons";
import StatCard from "@/components/admin/StatCard";
import { getStats } from "@/lib/data";

function Action({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="action">
      <span className="btn">{icon}</span>
      {label}
    </Link>
  );
}

export default function HomePage() {
  const stats = getStats();

  return (
    <div className="page">
      <header className="page-header home">
        <h1 style={{ margin: 0, fontSize: "inherit" }}>Hello, Admin!</h1>
      </header>

      <div className="body">
        <div className="action-groups">
          <section className="action-group" aria-label="Events">
            <Action href="/admin%20dashboard/events/create" label="Create Event" icon={<PlusCircleIcon />} />
            <Action href="/admin%20dashboard/events" label="Manage Events" icon={<StarIcon />} />
          </section>
          <section className="action-group alt" aria-label="Users">
            <Action href="/admin%20dashboard/users/create" label="Create User" icon={<PlusCircleIcon />} />
            <Action href="/admin%20dashboard/users" label="Manage Users" icon={<UsersIcon />} />
          </section>
        </div>

        <section className="overview" aria-label="Report logs overview">
          <div className="overview-head">
            <span>Report Logs Overview</span>
            <Link href="/admin%20dashboard/reports" className="pill">View More</Link>
          </div>
          <div className="stats">
            <StatCard label="Total Events" value={stats.totalEvents} />
            <StatCard label="Active Events" value={stats.activeEvents} />
            <StatCard label="Active Users" value={stats.activeUsers} />
          </div>
        </section>
      </div>
    </div>
  );
}
