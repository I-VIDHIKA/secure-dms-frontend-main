import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog, EmptyState, LoadingSkeleton } from "@/components/common";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { useCase, useCaseActivity, useCaseDocuments, useUpdateCase } from "@/hooks/use-api";
import { useCurrentUser } from "@/contexts/auth";
import { can } from "@/lib/permissions";
import { formatDate, formatDateTime, initials, personName } from "@/lib/format";

export const Route = createFileRoute("/_app/cases/$id")({
  head: () => ({
    meta: [
      { title: "Case file — Secure DMS" },
      { name: "description", content: "Case details, assigned officers, documents and activity." },
      { property: "og:title", content: "Case file — Secure DMS" },
      { property: "og:description", content: "Case documents and chain of custody." },
    ],
  }),
  component: CaseDetail,
});

function CaseDetail() {
  const { id } = Route.useParams();
  const user = useCurrentUser();
  const { data: c, isLoading, error } = useCase(id);
  const { data: docs = [], isLoading: docsLoading } = useCaseDocuments(id);
  const { data: activity = [] } = useCaseActivity(id);
  const update = useUpdateCase(id);
  const [confirm, setConfirm] = useState(false);

  if (error)
    return (
      <EmptyState
        title="Case not found"
        description={error.message}
        action={
          <Button asChild variant="outline">
            <Link to="/cases">Back to cases</Link>
          </Button>
        }
      />
    );
  if (isLoading || !c) return <LoadingSkeleton />;
  const nextStatus = c.status === "open" ? "closed" : "open";

  return (
    <>
      <Link
        to="/cases"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All cases
      </Link>
      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="hash text-sm text-muted-foreground">{c.case_number}</span>
              <Badge variant={c.status === "open" ? "success" : "muted"} className="uppercase">
                {c.status}
              </Badge>
            </div>
            <h1 className="mt-1 text-2xl font-semibold">{c.title}</h1>
            {c.description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{c.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Opened by {personName(c.created_by)}</span>
              <span>Registered {formatDate(c.created_at)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {can(user.role, "upload") && c.status === "open" && (
              <Button asChild>
                <Link to="/upload">
                  <Upload className="h-4 w-4" />
                  Upload document
                </Link>
              </Button>
            )}
            {can(user.role, "createCase") && (
              <Button
                variant="outline"
                onClick={() => setConfirm(true)}
                disabled={update.isPending}
              >
                {c.status === "open" ? "Close case" : "Re-open case"}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-5 border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Assigned people
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {c.assigned.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {initials(p.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="leading-tight">
                  <p className="text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.designation || p.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="docs" className="mt-6">
        <TabsList>
          <TabsTrigger value="docs">Documents ({docs.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({activity.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="docs" className="mt-4">
          {docsLoading ? <LoadingSkeleton /> : <DocumentTable documents={docs} showCase={false} />}
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          {!activity.length ? (
            <EmptyState title="No activity recorded" />
          ) : (
            <Card className="divide-y">
              {activity.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <Badge variant="muted" className="hash">
                    {a.action}
                  </Badge>
                  <span className="font-medium">{personName(a.user)}</span>
                  <span className="flex-1 text-muted-foreground">{a.details}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(a.ts)}</span>
                </div>
              ))}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={c.status === "open" ? "Close this case?" : "Re-open this case?"}
        description={
          c.status === "open"
            ? "No new documents or versions can be added while the case is closed. Existing records stay untouched."
            : "New documents and versions can be added again."
        }
        confirmLabel={c.status === "open" ? "Close case" : "Re-open case"}
        onConfirm={() => update.mutate({ status: nextStatus })}
      />
    </>
  );
}
