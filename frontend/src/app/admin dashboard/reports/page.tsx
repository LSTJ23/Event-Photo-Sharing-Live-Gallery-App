import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { getStats, getTopOrganizers } from "@/lib/data";

export default function ReportLogsPage() {
  const stats = getStats();
  const top = getTopOrganizers();

  return (
    <div className="page">
      <PageHeader title="Report Logs" />
      <div className="body">
        <div className="panel reports">
          <div className="stats">
            <StatCard label="Total Events" value={stats.totalEvents} />
            <StatCard label="Active Events" value={stats.activeEvents} />
            <StatCard label="Active Users" value={stats.activeUsers} />
          </div>

          <div className="row">
            <section className="box" aria-label="Top organizers">
              <h3>Top Organizers</h3>
              {top.length > 0 && (
                <ol>
                  {top.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ol>
              )}
            </section>
            <section className="box" aria-label="Additional report" />
          </div>
        </div>
      </div>
    </div>
  );
}
