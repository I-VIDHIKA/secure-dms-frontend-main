import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { ConfirmDialog, LoadingSkeleton, PageHeader } from "@/components/common";
import { useUpdateActive, useUpdateRole, useUsers } from "@/hooks/use-api";
import { useCurrentUser } from "@/contexts/auth";
import { requireAuth } from "@/lib/permissions";
import { formatDate, formatDateTime, initials } from "@/lib/format";
import type { Role, User } from "@/types";

export const Route = createFileRoute("/_app/users")({
  beforeLoad: () => requireAuth(["admin"]),
  head: () => ({
    meta: [
      { title: "Users — Secure DMS" },
      { name: "description", content: "Manage user roles and review activity." },
      { property: "og:title", content: "Users — Secure DMS" },
      { property: "og:description", content: "Role-based access management." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const me = useCurrentUser();
  const { data = [], isLoading } = useUsers();
  const update = useUpdateRole();
  const setActive = useUpdateActive();
  const [pending, setPending] = useState<{ user: User; role: Role } | null>(null);

  return (
    <>
      <PageHeader
        title="Users"
        description="Role changes and account status changes are recorded in the audit chain."
      />
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Activity</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-44">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-xs text-primary">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {u.name}
                          {u.id === me.id && (
                            <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{u.designation || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(u.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {u.last_login ? formatDateTime(u.last_login) : "Never"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{u.activity_count ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={u.is_active}
                        disabled={u.id === me.id || setActive.isPending}
                        onCheckedChange={(v) => setActive.mutate({ id: u.id, is_active: v })}
                        aria-label={`${u.is_active ? "Deactivate" : "Activate"} ${u.name}`}
                      />
                      {!u.is_active && <Badge variant="muted">Disabled</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      disabled={u.id === me.id}
                      onValueChange={(r) => setPending({ user: u, role: r as Role })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="investigator">Investigator</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title="Change role?"
        description={
          pending
            ? `${pending.user.name} will change from ${pending.user.role} to ${pending.role}. This is recorded in the audit chain.`
            : ""
        }
        confirmLabel="Change role"
        onConfirm={() => {
          if (pending) update.mutate({ id: pending.user.id, role: pending.role });
          setPending(null);
        }}
      />
    </>
  );
}
