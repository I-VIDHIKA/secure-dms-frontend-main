import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, FileText, FolderOpen, ShieldCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton, PageHeader, StatCard } from "@/components/common";
import { useDashboard } from "@/hooks/use-api";
import { useCurrentUser } from "@/contexts/auth";
import { formatRelative, personName } from "@/lib/format";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Secure DMS" },
      {
        name: "description",
        content: "Overview of documents, cases, integrity and tampering alerts.",
      },
      { property: "og:title", content: "Dashboard — Secure DMS" },
      { property: "og:description", content: "Document integrity at a glance." },
    ],
  }),
  component: Dashboard,
});

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 12,
  color: "var(--popover-foreground)",
};
const actionVariant = (a: string) =>
  a === "VERIFY" || a === "ANCHORED"
    ? "success"
    : a.endsWith("_FAILED") || a === "ACCESS_DENIED" || a === "ROLE_CHANGE"
      ? "danger"
      : a === "UPLOAD" || a === "NEW_VERSION" || a.startsWith("CASE_")
        ? "info"
        : "muted";

function Dashboard() {
  const user = useCurrentUser();
  const { data, isLoading } = useDashboard();
  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name}. Here is the state of the evidence vault.`}
      />
      {isLoading || !data ? (
        <LoadingSkeleton variant="cards" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FileText}
              label="Total documents"
              value={data.total_documents}
              hint="Documents you can access"
            />
            <StatCard
              icon={FolderOpen}
              label="Active cases"
              value={data.active_cases}
              hint="Open investigations"
            />
            <StatCard
              icon={ShieldCheck}
              label="Anchored on-chain"
              value={`${data.anchored_percent}%`}
              hint="Versions with a blockchain proof"
              tone="success"
            />
            <StatCard
              icon={AlertTriangle}
              label="Tampering alerts"
              value={data.tamper_alerts}
              hint="Failed verifications (admin)"
              tone={data.tamper_alerts ? "danger" : "success"}
            />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            <Card className="p-5 lg:col-span-3">
              <h2 className="text-sm font-semibold">Documents by type</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.documents_by_type} margin={{ left: -20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="type"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="count" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold">Uploads per day · last 14 days</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.uploads_per_day} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      interval={2}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          <Card className="mt-4 p-5">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <ul className="mt-3 divide-y">
              {!data.recent_activity.length && (
                <li className="py-2.5 text-sm text-muted-foreground">No activity yet.</li>
              )}
              {data.recent_activity.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm"
                >
                  <Badge variant={actionVariant(a.action)} className="hash w-40 justify-center">
                    {a.action}
                  </Badge>
                  <span className="font-medium">{personName(a.user)}</span>
                  <span className="flex-1 text-muted-foreground">{a.details}</span>
                  <span className="text-xs text-muted-foreground">{formatRelative(a.ts)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </>
  );
}
