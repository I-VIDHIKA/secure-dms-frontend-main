import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileDown, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, LoadingSkeleton, PageHeader } from "@/components/common";
import { ChainStatus, HashText } from "@/components/security";
import { useAudit, useExportAudit, useVerifyChain } from "@/hooks/use-api";
import { useDebounce } from "@/hooks/use-debounce";
import { requireAuth } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_app/audit")({
  beforeLoad: () => requireAuth(["admin"]),
  head: () => ({
    meta: [
      { title: "Audit log — Secure DMS" },
      { name: "description", content: "Hash-chained, tamper-evident audit trail of every action." },
      { property: "og:title", content: "Audit log — Secure DMS" },
      { property: "og:description", content: "Tamper-evident audit chain." },
    ],
  }),
  component: AuditPage,
});

// Actions the backend records.
const ACTIONS = [
  "LOGIN",
  "LOGIN_FAILED",
  "LOGOUT",
  "REGISTER",
  "UPLOAD",
  "NEW_VERSION",
  "VIEW",
  "DOWNLOAD",
  "VERIFY",
  "VERIFY_FAILED",
  "ANCHORED",
  "ANCHOR_FAILED",
  "SEARCH",
  "ACCESS_DENIED",
  "CASE_CREATE",
  "CASE_UPDATE",
  "CASE_ASSIGN",
  "ROLE_CHANGE",
  "USER_ENABLED",
  "USER_DISABLED",
  "AUDIT_EXPORT",
];
const PAGE_SIZE = 50;

const actionVariant = (a: string) =>
  a === "VERIFY" || a === "ANCHORED"
    ? "success"
    : a.endsWith("_FAILED") || a === "ACCESS_DENIED"
      ? "danger"
      : "muted";

function AuditPage() {
  const [userText, setUserText] = useState("");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const user = useDebounce(userText, 350);

  const { data, isLoading, isFetching } = useAudit({
    user: user || undefined,
    action: action === "all" ? undefined : action,
    date_from: from || undefined,
    date_to: to || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const verify = useVerifyChain();
  const exportCsv = useExportAudit();

  // Check the chain once when the page opens.
  useEffect(() => {
    verify.mutate(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const resetPage =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(0);
    };
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Append-only, hash-chained record of every action in the system."
        actions={
          <Button
            variant="outline"
            onClick={() => exportCsv.mutate()}
            disabled={exportCsv.isPending}
          >
            <FileDown className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />
      <ChainStatus
        valid={verify.data ? verify.data.valid : null}
        checked={verify.data?.checked}
        brokenAt={verify.data?.broken_at}
        reason={verify.data?.reason}
        loading={verify.isPending}
        onVerify={() => verify.mutate()}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">User (email contains)</Label>
          <Input
            value={userText}
            onChange={(e) => resetPage(setUserText)(e.target.value)}
            placeholder="e.g. priya"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Action</Label>
          <Select value={action} onValueChange={resetPage(setAction)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={(e) => resetPage(setFrom)(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={(e) => resetPage(setTo)(e.target.value)} />
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingSkeleton rows={10} />
        ) : !rows.length ? (
          <EmptyState icon={ScrollText} title="No entries match these filters" />
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Prev hash</TableHead>
                    <TableHead>Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="hash whitespace-nowrap">{e.id}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(e.ts)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{e.user}</TableCell>
                      <TableCell>
                        <Badge variant={actionVariant(e.action)} className="hash">
                          {e.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="hash whitespace-nowrap">{e.target}</TableCell>
                      <TableCell className="min-w-56 text-sm text-muted-foreground">
                        {e.details}
                      </TableCell>
                      <TableCell>
                        <HashText value={e.prev_hash} head={6} tail={4} />
                      </TableCell>
                      <TableCell>
                        <HashText value={e.hash} head={6} tail={4} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + rows.length} of {total}
                {isFetching ? " · updating…" : ""}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Newer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                >
                  Older
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
